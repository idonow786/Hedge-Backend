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
      BusinessType,
      Services,
      Products,
      ServiceandProduct
    } = req.body;

    if (!BusinessName || !BusinessAddress || !BusinessType) {
      return res.status(400).json({ message: 'BusinessName, BusinessAddress, and BusinessType are required' });
    }

    if (BusinessType === 'Services' && (!Services || Services.length === 0)) {
      return res.status(400).json({ message: 'At least one service must be provided for a service-based business' });
    }

    if (BusinessType === 'Product' && (!Products || Products.length === 0)) {
      return res.status(400).json({ message: 'At least one product must be provided for a product-based business' });
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
      BusinessType,
      Services: BusinessType === 'Services' ? Services : [],
      Products: BusinessType === 'Product' ? Products : [],
      ServiceandProduct: BusinessType === 'ServicesNProducts' ? ServiceandProduct : [],
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