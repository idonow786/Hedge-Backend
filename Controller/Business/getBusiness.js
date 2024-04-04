const Business = require('../../Model/Business');

const getBusinesss = async (req, res) => {
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
        { BusinessName: { $regex: search, $options: 'i' } },
        { BusinessAddress: { $regex: search, $options: 'i' } },
        { BusinessPhoneNo: { $regex: search, $options: 'i' } },
        { BusinessEmail: { $regex: search, $options: 'i' } },
        { CompanyType: { $regex: search, $options: 'i' } },
        { CompanyActivity: { $regex: search, $options: 'i' } },
        { OwnerName: { $regex: search, $options: 'i' } },
      ];
    }

    const business = await Business.findOne(query);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(200).json({
      message: 'Business retrieved successfully',
      business,
    });
  } catch (error) {
    console.error('Error retrieving business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getBusinesss };
