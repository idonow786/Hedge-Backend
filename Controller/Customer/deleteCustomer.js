const Customer = require('../../Model/Customer');
const Wallet = require('../../Model/Wallet');

const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.body.Customerid;
    const adminId = req.adminId;

    const customer = await Customer.findOne({ _id: customerId, AdminID: adminId });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or not authorized' });
    }

    const deletedCustomer = await Customer.findByIdAndDelete(customerId);

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
      wallet.TotalCustomers = (parseInt(wallet.TotalCustomers) - 1).toString();
      await wallet.save();
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

module.exports = { deleteCustomer };
