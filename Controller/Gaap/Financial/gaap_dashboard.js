const GaapProject = require('../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../Model/Gaap/gaap_projectPayment');
const GaapInvoice = require('../../../Model/Gaap/gaap_invoice');
const GaapDsr = require('../../../Model/Gaap/gaap_dsr');
const GaapSalesTarget = require('../../../Model/Gaap/gaap_salestarget');
const GaapUser = require('../../../Model/Gaap/gaap_user');

const getDashboardData = async (req, res) => {
  try {
    const userId = req.adminId;
    const user = await GaapUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const teamId = user.teamId;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // 1. Overview of all projects
    const projectOverview = await GaapProject.aggregate([
      { $match: { teamId: teamId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Define progress weights based on status
    const statusProgress = {
      'Proposed': 0,
      'In Progress': 50,
      'Approved': 75,
      'Completed': 100
      // Add more statuses and their corresponding progress if needed
    };

    // Calculate average progress based on projectOverview
    let totalProgress = 0;
    let totalProjects = 0;
    projectOverview.forEach(item => {
      const progress = statusProgress[item._id] !== undefined ? statusProgress[item._id] : 0;
      totalProgress += progress * item.count;
      totalProjects += item.count;
    });

    const averageProgress = totalProjects > 0 ? totalProgress / totalProjects : 0;

    // 2. Overview of all invoices
    const invoiceOverview = await GaapInvoice.aggregate([
      { $match: { teamId: teamId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    // 3. DSR (Daily Sales Report) summary for team users
    const today = new Date().setHours(0, 0, 0, 0);
    const dsrSummary = await GaapDsr.aggregate([
      {
        $match: { 
          date: today,
          userId: { $in: await GaapUser.find({ teamId: teamId }).distinct('_id') }
        }
      },
      {
        $group: {
          _id: null,
          totalOfficeVisits: { $sum: '$officeVisits' },
          totalCardsCollected: { $sum: '$cardsCollected' },
          totalMeetings: { $sum: '$meetings' },
          totalProposals: { $sum: '$proposals' }
        }
      }
    ]);

    // 4. Remove the original projectProgress aggregation as it's no longer needed
    // Instead, use the calculated averageProgress above

    // 5. Financial overview
    const financialOverview = await ProjectPayment.aggregate([
      {
        $match: {
          'paymentHistory.date': { $gte: startOfMonth, $lte: endOfMonth },
          teamId: teamId
        }
      },
      {
        $unwind: '$paymentHistory'
      },
      {
        $group: {
          _id: null,
          totalCashInflow: { $sum: '$paymentHistory.amount' },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    const totalInvoicesCreated = await GaapInvoice.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      teamId: teamId
    });

    // 6. Sales targets summary
    const salesTargetsSummary = await GaapSalesTarget.aggregate([
      {
        $match: {
          'targetPeriod.endDate': { $gte: currentDate },
          teamId: teamId
        }
      },
      {
        $group: {
          _id: '$targetType',
          totalOfficeVisitsTarget: { $sum: '$targetDetails.officeVisits' },
          totalClosingsTarget: { $sum: '$targetDetails.closings' },
          totalOfficeVisitsAchieved: { $sum: '$achievedValue.officeVisits' },
          totalClosingsAchieved: { $sum: '$achievedValue.closings' }
        }
      }
    ]);

    // Prepare the response
    const dashboardData = {
      projectOverview: projectOverview.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      invoiceOverview: invoiceOverview.reduce((acc, item) => {
        acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
        return acc;
      }, {}),
      dsrSummary: dsrSummary.length > 0 ? dsrSummary[0] : null,
      projectProgress: {
        averageProgress: parseFloat(averageProgress.toFixed(2)), // Rounded to 2 decimal places
        totalProjects: totalProjects
      },
      financialOverview: {
        totalCashInflow: financialOverview.length > 0 ? financialOverview[0].totalCashInflow : 0,
        totalPayments: financialOverview.length > 0 ? financialOverview[0].totalPayments : 0,
        totalInvoicesCreated
      },
      salesTargetsSummary: salesTargetsSummary.reduce((acc, item) => {
        acc[item._id] = {
          officeVisits: {
            target: item.totalOfficeVisitsTarget,
            achieved: item.totalOfficeVisitsAchieved,
            progressPercentage: item.totalOfficeVisitsTarget > 0 
              ? (item.totalOfficeVisitsAchieved / item.totalOfficeVisitsTarget) * 100 
              : 0
          },
          closings: {
            target: item.totalClosingsTarget,
            achieved: item.totalClosingsAchieved,
            progressPercentage: item.totalClosingsTarget > 0 
              ? (item.totalClosingsAchieved / item.totalClosingsTarget) * 100 
              : 0
          }
        };
        return acc;
      }, {})
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

module.exports = {
  getDashboardData
};
