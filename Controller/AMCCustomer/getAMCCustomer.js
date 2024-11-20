const AMCCustomer = require('../../Model/AMCCustomer');

const getAMCCustomers = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.body;
        const adminId = req.adminId;

        let query = { AdminID: adminId };

        if (startDate && endDate) {
            query.DateJoined = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else if (startDate) {
            query.DateJoined = {
                $gte: new Date(startDate),
                $lte: new Date(startDate),
            };
        } else if (endDate) {
            query.DateJoined = {
                $lte: new Date(endDate),
            };
        }

        if (search) {
            query.$or = [
                { Name: { $regex: search, $options: 'i' } },
                { Email: { $regex: search, $options: 'i' } },
                { PhoneNo: { $regex: search, $options: 'i' } },
            ];
        }

        const customers = await AMCCustomer.find(query);

        res.status(200).json({
            message: 'AMC Customers retrieved successfully',
            customers,
        });
    } catch (error) {
        console.error('Error retrieving AMC customers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getAMCCustomers }; 