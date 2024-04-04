const Customer = require('../../Model/Customer');

const getCustomers = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.user.adminId;

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

    const customers = await Customer.find(query);

    res.status(200).json({
      message: 'Customers retrieved successfully',
      customers,
    });
  } catch (error) {
    console.error('Error retrieving customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getCustomers };
