const AMCCustomer = require('../../Model/AMCCustomer');
const Wallet = require('../../Model/Wallet');

const deleteAMCCustomer = async (req, res) => {
    try {
        const customerId = req.body.Customerid;
        const adminId = req.adminId;

        const customer = await AMCCustomer.findOne({ _id: customerId, AdminID: adminId });

        if (!customer) {
            return res.status(404).json({ message: 'AMC Customer not found or not authorized' });
        }

        const deletedCustomer = await AMCCustomer.findByIdAndDelete(customerId);

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
            wallet.TotalAMCCustomers = (parseInt(wallet.TotalAMCCustomers || 0) - 1).toString();
            await wallet.save();
        }

        res.status(200).json({
            message: 'AMC Customer deleted successfully',
            customer: deletedCustomer,
        });
    } catch (error) {
        console.error('Error deleting AMC customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { deleteAMCCustomer }; 