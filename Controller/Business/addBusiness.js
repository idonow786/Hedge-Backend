const Business = require('../../Model/Business');

const addBusiness = async (req, res) => {
  try {
    const { BusinessTitle, Address, Date, PhoneNo } = req.body;

    if (!BusinessTitle || !Address || !Date) {
      return res.status(400).json({ message: 'BusinessTitle, Address, and Date are required' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    const newBusiness = new Business({
      ID,
      BusinessTitle,
      Address,
      Date,
      PhoneNo,
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

module.exports={addBusiness}