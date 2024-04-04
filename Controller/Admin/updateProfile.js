const Admin = require('../../Model/Admin');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');



const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.adminId
;
    const { name, email, gender } = req.body;

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.Name = name || admin.Name;
    admin.Email = email || admin.Email;
    admin.Gender = gender || admin.Gender;

    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const contentType = req.file.mimetype;

      const imageUrl = await uploadImageToFirebase(base64Image, contentType);
      admin.PicUrl = imageUrl;
    }

    const updatedAdmin = await admin.save();

    res.status(200).json({
      message: 'Admin profile updated successfully',
      profile: {
        id: updatedAdmin._id,
        name: updatedAdmin.Name,
        email: updatedAdmin.Email,
        picUrl: updatedAdmin.PicUrl,
        gender: updatedAdmin.Gender,
      },
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={updateAdminProfile}