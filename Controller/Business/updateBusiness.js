const Business = require('../../Model/Business');

const updateBusiness = async (req, res) => {
  try {
    const { BusinessId, BusinessTitle,PhoneNo, Address, Date, Description } = req.body;

    if (!BusinessId) {
      return res.status(400).json({ message: 'BusinessId is required' });
    }

    const Business = await Business.findById(BusinessId );

    if (!Business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    Business.BusinessTitle = BusinessTitle || Business.BusinessTitle;
    Business.PhoneNo = PhoneNo || Business.PhoneNo;
    Business.Date = Date || Business.Date;
    Business.Description = Description || Business.Description;
    Business.Address = Address || Business.Address;

    const updatedBusiness = await Business.save();

    res.status(200).json({
      message: 'Business updated successfully',
      Business: updatedBusiness,
    });
  } catch (error) {
    console.error('Error updating Business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={updateBusiness}