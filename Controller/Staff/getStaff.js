const Staff = require('../../Model/Staff');

const getstaffs = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;

    let query = {};

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
      ];
    }

    const staffs = await Staff.find(query);

    res.status(200).json({
      message: 'staffs retrieved successfully',
      staffs,
    });
  } catch (error) {
    console.log('Error retrieving staffs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={getstaffs}