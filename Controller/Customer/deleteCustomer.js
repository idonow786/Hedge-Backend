const Customer = require('../../Model/Customer');

const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.body.Customerid;
    const adminId = req.adminId
;

    const customer = await Customer.findOne({ _id: customerId, AdminID: adminId });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or not authorized' });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

    res.status(200).json({
      message: 'Customer deleted successfully',
      customer: deletedCustomer,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { deleteCustomer };
