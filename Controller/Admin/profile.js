const Admin = require('../../Model/Admin');

const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.adminId;

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin profile retrieved successfully',
      profile: {
        id: admin._id,
        name: admin.Name,
        email: admin.Email,
        picUrl: admin.PicUrl,
        gender: admin.Gender,
      },
    });
  } catch (error) {
    console.error('Error retrieving admin profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={getAdminProfile}