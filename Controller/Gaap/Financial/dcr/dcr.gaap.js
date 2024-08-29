const DailyPerformanceReport = require('../../../../Model/Gaap/gaap_financeDcr');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../../Model/Gaap/gaap_team')

// Create a new daily performance report
const createReport = async (req, res) => {
  try {
    const { date, cashInflow, cashOutflow, invoicesCreated } = req.body;

    const existingReport = await DailyPerformanceReport.findOne({ date });
    if (existingReport) {
      return res.status(400).json({ message: 'A report for this date already exists' });
    }
    const user = await GaapUser.findById(req.adminId)

    const newReport = new DailyPerformanceReport({
      date,
      cashInflow,
      cashOutflow,
      teamId: user.teamId,
      invoicesCreated,
      createdBy: req.adminId
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ message: 'Error creating report', error: error.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    let reports;
    console.log(req.role)
    console.log(await DailyPerformanceReport.find() )
    if (req.role !== 'admin' && req.role !== 'Operation Manager') {
      reports = await DailyPerformanceReport.find({ createdBy: req.adminId }).sort({ date: -1 });
    } else {
      const team = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': req.adminId },
          { 'GeneralUser.userId': req.adminId }
        ]
      });
      if (team) {
        reports = await DailyPerformanceReport.find({ teamId: team._id }).sort({ date: -1 });
      }
    }
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
};

const getReportById = async (req, res) => {
  try {
    const report = await DailyPerformanceReport.findById(req.query.dcrId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};

// Update a daily performance report
const updateReport = async (req, res) => {
  try {
    const { cashInflow, cashOutflow, invoicesCreated, date } = req.body;
    const updatedReport = await DailyPerformanceReport.findByIdAndUpdate(
      req.body.dcrId,
      {
        date,
        cashInflow,
        cashOutflow,
        invoicesCreated,
        updatedBy: req.adminId
      },
      { new: true, runValidators: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: 'Error updating report', error: error.message });
  }
};

// Delete a daily performance report
const deleteReport = async (req, res) => {
  try {
    const deletedReport = await DailyPerformanceReport.findByIdAndDelete(req.body.dcrId);
    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
};

// Get report by date
const getReportByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const report = await DailyPerformanceReport.findOne({ date: new Date(date) });
    if (!report) {
      return res.status(404).json({ message: 'Report not found for the given date' });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};


module.exports = { createReport, getAllReports, updateReport, deleteReport, getReportByDate }