const Business = require('../../Model/Business');

const getBusinesss = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;

    let query = {};

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
        { BusinessTitle: { $regex: search, $options: 'i' } },
        { Address: { $regex: search, $options: 'i' } },
        { PhoneNo: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
      ];
    }

    const Businesss = await Business.find(query);

    res.status(200).json({
      message: 'Businesss retrieved successfully',
      Businesss,
    });
  } catch (error) {
    console.error('Error retrieving Businesss:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={getBusinesss}