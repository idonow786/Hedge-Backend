const Business = require('../../Model/Business');

const updateBusiness = async (req, res) => {
  try {
    const {
      BusinessName,
      BusinessAddress,
      BusinessPhoneNo,
      BusinessEmail,
      CompanyType,
      CompanyActivity,
      OwnerName,
      NumberofEmployees,
      YearofEstablishment,
    } = req.body;

    const adminId = req.adminId
;

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const business = await Business.findOne({ AdminID: adminId });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    business.BusinessName = BusinessName || business.BusinessName;
    business.BusinessAddress = BusinessAddress || business.BusinessAddress;
    business.BusinessPhoneNo = BusinessPhoneNo || business.BusinessPhoneNo;
    business.BusinessEmail = BusinessEmail || business.BusinessEmail;
    business.CompanyType = CompanyType || business.CompanyType;
    business.CompanyActivity = CompanyActivity || business.CompanyActivity;
    business.OwnerName = OwnerName || business.OwnerName;
    business.NumberofEmployees = NumberofEmployees || business.NumberofEmployees;
    business.YearofEstablishment = YearofEstablishment || business.YearofEstablishment;

    const updatedBusiness = await business.save();

    res.status(200).json({
      message: 'Business updated successfully',
      Business: updatedBusiness,
    });
  } catch (error) {
    console.error('Error updating Business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateBusiness };
