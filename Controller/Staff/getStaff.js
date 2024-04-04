const Staff = require('../../Model/Staff');

const getStaffs = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.adminId
;

    let query = { AdminID: adminId };

    if (startDate && endDate) {
      query.Date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.Date = {
        $gte: new Date(startDate),
        $lte: new Date(startDate),
      };
    } else if (endDate) {
      query.Date = {
        $lte: new Date(endDate),
      };
    }

    if (search) {
      query.$or = [
        { StaffName: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
        { PhoneNo: { $regex: search, $options: 'i' } },
      ];
    }

    const staffs = await Staff.find(query);

    res.status(200).json({
      message: 'Staffs retrieved successfully',
      staffs,
    });
  } catch (error) {
    console.error('Error retrieving staffs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getStaffs };
