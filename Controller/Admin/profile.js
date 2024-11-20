const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
const Business = require('../../Model/Business');
const Payment = require('../../Model/Payment');
const Staff = require('../../Model/Staff');
const Project = require('../../Model/Project');
const GaapUser = require('../../Model/Gaap/gaap_user'); 
const AccountingUser = require('../../Model/Accounting/accounting_user'); 
const ATISUser = require('../../Model/ATIS/atis_user'); 

const getAdminProfile = async (req, res) => {
  try {
    const userId = req.adminId; 

    let user = await Admin.findById(userId);

    if (!user) {
      user = await GaapUser.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userProfile = {
      id: user._id,
      username: user.username || user.Name,
      email: user.email || user.Email,
      role: user.role,
      fullName: user.fullName,
      department: user.department,
    };

    if (user.constructor.modelName === 'GaapUser') {
      userProfile.isActive = user.isActive;
      userProfile.lastLogin = user.lastLogin;
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      user: userProfile
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
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
    const gaapUsers = await GaapUser.find({role: 'admin'});

    const users = [...admins, ...superAdmins, ...gaapUsers];

    const usersWithBusinessesAndPayments = await Promise.all(users.map(async (user) => {
      const payments = await Payment.find({ UserID: user._id });
      let status = 'No Payments';
      if (payments.length > 0) {
        status = payments[0].Status;
      }

      let businesses = [];
      if (user.constructor.modelName !== 'GaapUser') {
        businesses = await Business.find({ AdminID: user._id });
      }

      let userObject;

      if (user.constructor.modelName === 'GaapUser') {
        // Restructure GaapUser to match Admin structure
        userObject = {
          _id: user._id,
          ID: Math.floor(Math.random() * 1000000), 
          Name: user.fullName,
          Email: user.email,
          PicUrl: user.profilePhoto,
          companyActivity:'gaap',
          Password: user.password, 
          Gender: 'Other',
          Otp: '', 
          role: user.role,
          OtpVerified: false,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          // // Additional GaapUser specific fields
          // username: user.username,
          // manager: user.manager,
          // managerType: user.managerType,
          // teamId: user.teamId,
          // department: user.department,
          // companyActivity: user.companyActivity,
          // address: user.address,
          // nationality: user.nationality,
          // phoneNumber: user.phoneNumber,
          // createdBy: user.createdBy,
          // targets: user.targets
        };
      } else {
        userObject = user.toObject();
      }

      return {
        ...userObject,
        userType: user.constructor.modelName,
        status,
        payments,
        businesses
      };
    }));

    res.status(200).json({ users: usersWithBusinessesAndPayments });
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

    const userId = req.body.userId;

    let deletedUser = await Admin.findByIdAndDelete(userId);

    if (!deletedUser) {
      deletedUser = await GaapUser.findByIdAndDelete(userId);
    }

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (deletedUser.constructor.modelName === 'Admin') {
      await Business.deleteMany({ AdminID: userId });

      await Staff.deleteMany({ AdminID: userId });

      await Project.deleteMany({ AdminID: userId });
    }

    await Payment.deleteMany({ UserID: userId });

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user and associated data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAtisUsers = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Only superadmins can retrieve users.' });
    }

    const admins = await Admin.find();
    const gaapUsers = await ATISUser.find({role: 'admin'});
    const users = [...admins, ...gaapUsers];

    const atisUsersWithData = await Promise.all(users.map(async (user) => {
      const businesses = await Business.find({ 
        CompanyActivity: 'atis'
      });
      console.log(businesses)
      // Only include users who have atis businesses
      if (businesses.length === 0) return null;

      const payments = await Payment.find({ UserID: user._id });
      let status = 'No Payments';
      if (payments.length > 0) {
        status = payments[0].Status;
      }

      let userObject = user.constructor.modelName === 'ATISUser' ? {
        _id: user._id,
        ID: Math.floor(Math.random() * 1000000),
        Name: user.fullName,
        Email: user.email,
        PicUrl: user.profilePhoto,
        companyActivity: 'atis',
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      } : user.toObject();

      return {
        ...userObject,
        userType: user.constructor.modelName,
        status,
        payments,
        businesses
      };
    }));

    // Filter out null values and users without atis businesses
    const filteredUsers = atisUsersWithData.filter(user => user !== null);

    res.status(200).json({ 
      message: 'Atis users retrieved successfully',
      count: filteredUsers.length,
      users: filteredUsers 
    });
  } catch (error) {
    console.error('Error getting atis users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAccountingUsers = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Only superadmins can retrieve users.' });
    }

    const admins = await Admin.find();
    const gaapUsers = await AccountingUser.find({role: 'admin'});
    const users = [...admins, ...gaapUsers];

    const accountingUsersWithData = await Promise.all(users.map(async (user) => {
      const businesses = await Business.find({ 
        CompanyActivity: 'accounting'
      });

      // Only include users who have accounting businesses
      if (businesses.length === 0) return null;

      const payments = await Payment.find({ UserID: user._id });
      let status = 'No Payments';
      if (payments.length > 0) {
        status = payments[0].Status;
      }

      let userObject = user.constructor.modelName === 'AccountingUser' ? {
        _id: user._id,
        ID: Math.floor(Math.random() * 1000000),
        Name: user.fullName,
        Email: user.email,
        PicUrl: user.profilePhoto,
        companyActivity: 'accounting',
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      } : user.toObject();

      return {
        ...userObject,
        userType: user.constructor.modelName,
        status,
        payments,
        businesses
      };
    }));

    // Filter out null values and users without accounting businesses
    const filteredUsers = accountingUsersWithData.filter(user => user !== null);

    res.status(200).json({ 
      message: 'Accounting users retrieved successfully',
      count: filteredUsers.length,
      users: filteredUsers 
    });
  } catch (error) {
    console.error('Error getting accounting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={getAdminProfile,getAllUsersWithBusinesses,DeleteUser,getAtisUsers,getAccountingUsers}