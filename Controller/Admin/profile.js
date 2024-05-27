const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
const Business = require('../../Model/Business');
const Payment = require('../../Model/Payment');
const Staff = require('../../Model/Staff');
const Project = require('../../Model/Project');

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

    const usersWithPayments = await Promise.all(users.map(async (user) => {
      const payments = await Payment.find({ UserID: user._id });
      let status = 'No Payments';
      if (payments.length > 0) {
        status = payments[0].Status;
      }
      return {
        ...user.toObject(),
        status,
        payments
      };
    }));

    res.status(200).json({ users: usersWithPayments });
  } catch (error) {
    console.error('Error getting users with businesses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const DeleteUser = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Only superadmins can delete users.' });
    }

    const adminId = req.body.adminId;

    // Delete the admin
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);
    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Delete associated businesses
    await Business.deleteMany({ AdminID: adminId });

    // Delete associated payments
    await Payment.deleteMany({ UserID: adminId });
    await Staff.deleteMany({ AdminID: adminId });
    await Project.deleteMany({ AdminID: adminId });

    res.status(200).json({ message: 'Admin and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin and associated data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports={getAdminProfile,getAllUsersWithBusinesses,DeleteUser}