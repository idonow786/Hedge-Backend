const Business = require('../../Model/Business');

const addBusiness = async (req, res) => {
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

    if (!BusinessName || !BusinessAddress) {
      return res.status(400).json({ message: 'BusinessName and BusinessAddress are required' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    const newBusiness = new Business({
      ID,
      BusinessName,
      BusinessAddress,
      BusinessPhoneNo,
      BusinessEmail,
      CompanyType,
      CompanyActivity,
      OwnerName,
      NumberofEmployees,
      YearofEstablishment,
    });

    const savedBusiness = await newBusiness.save();

    res.status(201).json({
      message: 'Business added successfully',
      Business: savedBusiness,
    });
  } catch (error) {
    console.error('Error adding Business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addBusiness };