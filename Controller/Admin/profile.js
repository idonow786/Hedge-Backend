const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
const Business = require('../../Model/Business');

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


const getAllUsersWithBusinesses = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Only superadmins can retrieve all users.' });
    }

    const admins = await Admin.find();
    const superAdmins = await SuperAdmin.find();

    const users = [...admins, ...superAdmins];

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error getting users with businesses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={getAdminProfile,getAllUsersWithBusinesses}