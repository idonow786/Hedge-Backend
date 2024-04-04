const Customer = require('../../Model/Customer');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const addCustomer = async (req, res) => {
  try {
    const { Name, Email, PhoneNo, DateJoined, DateofBirth } = req.body;

    if (!Name || !Email || !PhoneNo) {
      return res.status(400).json({ message: 'Name, Email, and PhoneNo are required' });
    }

    const existingCustomer = await Customer.findOne({ Email });
    if (existingCustomer) {
      return res.status(409).json({ message: 'Customer already exists' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    let picUrl = '';
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const contentType = req.file.mimetype;

      try {
        const imageUrl = await uploadImageToFirebase(base64Image, contentType);
        picUrl = imageUrl;
      } catch (error) {
        console.error('Error uploading image to Firebase:', error);
      }
    }

    const newCustomer = new Customer({
      ID,
      Name,
      Email,
      PhoneNo,
      DateJoined: DateJoined ? new Date(DateJoined) : undefined,
      DateofBirth: DateofBirth ? new Date(DateofBirth) : undefined,
      PicUrl: picUrl,
      AdminID: req.user.adminId,
    });

    const savedCustomer = await newCustomer.save();

    res.status(201).json({
      message: 'Customer added successfully',
      customer: savedCustomer,
    });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addCustomer };
