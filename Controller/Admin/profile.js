const Admin = require('../../Model/Admin');

const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.adminId
;
    console.log(adminId)
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Admin profile retrieved successfully',
      admin
    });
  } catch (error) {
    console.error('Error retrieving admin profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={getAdminProfile}