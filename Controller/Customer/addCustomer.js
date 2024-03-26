const Customer = require('../../Model/Customer');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const addCustomer = async (req, res) => {
  try {
    const { Name, Email, PhoneNo, DateJoined } = req.body;

    const ID = Math.floor(Math.random() * 1000000);

    let picUrl=''
    if (req.file) {
        const base64Image = req.file.buffer.toString('base64');
        const contentType = req.file.mimetype;
  
        const imageUrl = await uploadImageToFirebase(base64Image, contentType);
        picUrl = imageUrl;
      }

    const newCustomer = new Customer({
      ID,
      Name,
      Email,
      PhoneNo,
      DateJoined,
      PicUrl: picUrl,
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



module.exports={addCustomer}
