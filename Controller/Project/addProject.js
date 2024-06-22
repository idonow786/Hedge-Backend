const Project = require('../../Model/Project');
const Business = require('../../Model/Business');
const Customer = require('../../Model/Customer');
const Wallet = require('../../Model/Wallet');

const addProject = async (req, res) => {
  try {
    const {
      Description,
      Title,
      StartDate,
      Deadline,
      Budget,
      ProgressUpdate,
      DynamicFields,
      CustomerId,
    } = req.body;
    const adminId = req.adminId;

    if (!Description) {
      return res.status(400).json({ message: 'Description is required' });
    }
    if (!Title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!StartDate) {
      return res.status(400).json({ message: 'StartDate is required' });
    }
    if (!Deadline) {
      return res.status(400).json({ message: 'Deadline is required' });
    }
    if (!Budget) {
      return res.status(400).json({ message: 'Budget is required' });
    }
    if (!CustomerId) {
      return res.status(400).json({ message: 'CustomerId is required' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    const business = await Business.findOne({ AdminID: adminId });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const customer = await Customer.findById(CustomerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newProject = new Project({
      ID,
      Description,
      Title,
      StartDate,
      Deadline,
      AdminID: adminId,
      CustomerId,
      BusinessID: business._id,
      Budget,
      ProgressUpdate,
      DynamicFields,
    });

    const savedProject = await newProject.save();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
    });

    if (wallet) {
      wallet.TotalOrders = (parseInt(wallet.TotalOrders) + 1).toString();
    } else {
      wallet = new Wallet({
        TotalOrders: '1',
        AdminID: adminId,
        period: new Date(currentYear, currentMonth, 1),
      });
    }

    await wallet.save();

    res.status(201).json({
      message: 'Project added successfully',
      project: savedProject,
    });
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addProject };
