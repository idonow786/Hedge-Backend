const Customer = require('../../Model/Customer');

const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.body.Customerid;

    const deletedCustomer = await Customer.findByIdAndRemove(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer deleted successfully',
      customer: deletedCustomer,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={deleteCustomer}