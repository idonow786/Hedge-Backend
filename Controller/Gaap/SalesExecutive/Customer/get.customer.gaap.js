const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');

const getAllCustomersByAdmin = async (req, res) => {
  try {
    const adminId = req.adminId;
    let customers;
    if (req.role !== 'Parent User') {
      customers = await GaapCustomer.find({ registeredBy: adminId })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      customers = await GaapCustomer.find()
        .sort({ createdAt: -1 })
        .lean();
    }


    res.status(200).json({
      message: 'Customers fetched successfully',
      customers: customers,
      totalCustomers: customers.length
    });

  } catch (error) {
    console.error('Error in getAllCustomersByAdmin:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    res.status(500).json({ message: 'An error occurred while fetching customers' });
  }
};
module.exports = { getAllCustomersByAdmin }