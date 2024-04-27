const Project = require('../../Model/Project');
const Business = require('../../Model/Business');
const Customer = require('../../Model/Customer');

const addProject = async (req, res) => {
  try {
    const {
      Description,
      Title,
      StartDate,
      Deadline,
      Budget,
      DynamicFields,
      CustomerId,
    } = req.body;
    const adminId = req.adminId;

    if (!Description || !Title || !StartDate || !Deadline || !Budget || !CustomerId) {
      return res.status(400).json({ message: 'Please provide all required fields' });
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
      DynamicFields,
    });

    const savedProject = await newProject.save();

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