const Staff = require('../../Model/Staff');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const addStaff = async (req, res) => {
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

    const newaddStaff = new Staff({
      ID,
      Name,
      Email,
      PhoneNo,
      DateJoined,
      PicUrl: picUrl,
    });

    const savednewaddStaff = await newaddStaff.save();

    res.status(201).json({
      message: 'Staff added successfully',
      Staff: savednewaddStaff,
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports={addStaff}
