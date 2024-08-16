const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
const Vendor = require('../../Model/vendorSchema');
const Business = require('../../Model/Business');
const GaapUser = require('../../Model/Gaap/gaap_user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Payment = require('../../Model/Payment');
const GaapTeam = require('../../Model/Gaap/gaap_team');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');

dotenv.config();
const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

// Signup controller
const signup = async (req, res) => {
  try {
    const { username, email, password, role, businessName, BusinessAddress, BusinessPhoneNo, BusinessEmail, OwnerName, YearofEstablishment, BusinessType, CompanyType, CompanyActivity } = req.body;
    console.log('company Type : ',CompanyType)

    if (role !== 'superadmin') {
      if (req.role !== 'superadmin') {
        return res.status(400).json({ message: 'You are not Super Admin' });
      }
    }

    let existingUser;
    let newUser;
    let savedUser;

    if (role === 'superadmin') {
      existingUser = await SuperAdmin.findOne({ Email: email });
      if (existingUser) {
        return res.status(400).json({ message: 'Super Admin already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      newUser = new SuperAdmin({
        Name: username,
        Email: email,
        Password: hashedPassword,
      });

      savedUser = await newUser.save();
    }
    else if (CompanyType === 'gaap') {
      console.log('working gaap')
      existingUser = await GaapUser.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({ message: 'GAAP User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      newUser = new GaapUser({
        username: username,
        email: email,
        password: hashedPassword,
        fullName: username,
        role: 'admin',
      });

      savedUser = await newUser.save();

      const newBusiness = new Business({
        AdminID: savedUser._id,
        BusinessName: businessName,
        BusinessAddress: BusinessAddress,
        BusinessPhoneNo: BusinessPhoneNo,
        BusinessEmail: BusinessEmail,
        OwnerName: OwnerName,
        YearofEstablishment: YearofEstablishment,
        BusinessType: BusinessType,
        CompanyType: CompanyType,
        CompanyActivity: CompanyActivity
      });

      const savedBusiness = await newBusiness.save();
      console.log(savedBusiness)

      const newTeam = new GaapTeam({
        teamName: `${businessName} Team`,
        businessId: savedBusiness._id,
        parentUser: {
          userId: savedUser._id,
          name: username,
          role: 'admin'
        },
        members: []
      });

      await newTeam.save();

      console.log("team ",newTeam)
    } else {
      existingUser = await Admin.findOne({ Email: email });
      if (existingUser) {
        return res.status(400).json({ message: 'Admin already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      newUser = new Admin({
        Name: username,
        Email: email,
        Password: hashedPassword,
      });

      savedUser = await newUser.save();

      const newBusiness = new Business({
        AdminID: savedUser._id,
        BusinessName: businessName,
        BusinessAddress: BusinessAddress,
        BusinessPhoneNo: BusinessPhoneNo,
        BusinessEmail: BusinessEmail,
        OwnerName: OwnerName,
        YearofEstablishment: YearofEstablishment,
        BusinessType: BusinessType,
        CompanyType: CompanyType,
        CompanyActivity: CompanyActivity
      });

      await newBusiness.save();
    }
    const mailOptions = {
      from: process.env.Email_Sender,
      to: email,
      subject: 'Welcome to IDO - Your Business Growth Partner',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to IDO</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              text-align: center;
              padding: 20px 0;
            }
            .logo {
              max-width: 150px;
              height: auto;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            h1, h2, h3 {
              color: #2c3e50;
            }
            .credentials {
              background-color: #e8f4fd;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #3498db;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 0.9em;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://firebasestorage.googleapis.com/v0/b/crem-40ccb.appspot.com/o/images%2Fido-logo.png?alt=media" alt="IDO Logo" class="logo">
            </div>
            <div class="content">
              <h1>Welcome to IDO, ${username}!</h1>
              <p>We are thrilled to have you on board and excited to be part of your business growth journey. At IDO, we provide powerful software solutions to help small businesses manage and grow their operations effortlessly.</p>
              
              <div class="credentials">
                <h2>Your Sign-In Credentials</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>
              
              <a href="https://ido-crm.netlify.app/" class="btn">Log In to Your Account</a>
              
              <h3>What You Can Expect:</h3>
              <ul>
                <li><strong>Comprehensive Tools:</strong> From CRM to inventory management, our suite streamlines your business processes.</li>
                <li><strong>User-Friendly Interface:</strong> Intuitive and easy to navigate for a smooth experience.</li>
                <li><strong>24/7 Support:</strong> Our dedicated team is here to assist you anytime.</li>
              </ul>
              
              <h3>Next Steps:</h3>
              <ol>
                <li><strong>Log In:</strong> Use your credentials to access your account.</li>
                <li><strong>Explore:</strong> Take a tour of our platform and discover its features.</li>
                <li><strong>Get Started:</strong> Begin managing your business more efficiently.</li>
              </ol>
              
              <p>If you need any assistance, please don't hesitate to contact our support team at <a href="mailto:support@ido.company">support@ido.company</a>.</p>
              
              <p>Thank you for choosing IDO. We're excited to help you achieve your business goals!</p>
              
              <p>Best regards,<br>
              Ameer A<br>
              Founder & CEO<br>
              IDO</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 IDO. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ message: 'User created successfully', user: savedUser, role: savedUser.role });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const updateUser = async (req, res) => {
  try {
    const { id } = req.body;
    const { username, email, password, role, businessName, BusinessAddress, BusinessPhoneNo, BusinessEmail, OwnerName, YearofEstablishment, BusinessType, CompanyType, CompanyActivity } = req.body;

    let user;
    let isGaapUser = false;
    if (role === 'superadmin') {
      user = await SuperAdmin.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Super Admin not found' });
      }
    } else if (CompanyType === 'Gaap') {
      user = await GaapUser.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'GAAP User not found' });
      }
      isGaapUser = true;
    } else {
      user = await Admin.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }
    }

    let isEmailChanged = false;
    let isPasswordChanged = false;

    if (username) user.Name = username;
    if (email && user.Email !== email) {
      user.Email = email;
      isEmailChanged = true;
    }
    if (password) {
      user.Password = await bcrypt.hash(password, 10);
      isPasswordChanged = true;
    }

    const updatedUser = await user.save();

    if (role !== 'superadmin') {
      const business = await Business.findOne({ AdminID: id });
      if (business) {
        if (businessName) business.BusinessName = businessName;
        if (BusinessAddress) business.BusinessAddress = BusinessAddress;
        if (BusinessPhoneNo) business.BusinessPhoneNo = BusinessPhoneNo;
        if (BusinessEmail) business.BusinessEmail = BusinessEmail;
        if (OwnerName) business.OwnerName = OwnerName;
        if (YearofEstablishment) business.YearofEstablishment = YearofEstablishment;
        if (BusinessType) business.BusinessType = BusinessType;
        if (CompanyType) business.CompanyType = CompanyType;
        if (CompanyActivity) business.CompanyActivity = CompanyActivity;

        await business.save();
      }
    }

    // Send email if email or password changed
    if (isEmailChanged || isPasswordChanged) {
      const mailOptions = {
        from: process.env.Email_Sender,
        to: user.Email,
        subject: 'Your IDO Account Has Been Updated',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Update Notification</title>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
              }
              .header {
                text-align: center;
                padding: 20px 0;
              }
              .logo {
                max-width: 150px;
                height: auto;
              }
              .content {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              h1, h2 {
                color: #2c3e50;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.9em;
                color: #7f8c8d;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://firebasestorage.googleapis.com/v0/b/crem-40ccb.appspot.com/o/images%2Fido-logo.png?alt=media" alt="IDO Logo" class="logo">
              </div>
              <div class="content">
                <h1>Account Update Notification</h1>
                <p>Dear ${user.Name},</p>
                <p>Your IDO account has been updated. Here are the changes:</p>
                ${isEmailChanged ? `<p><strong>New Email:</strong> ${user.Email}</p>` : ''}
                ${isPasswordChanged ? '<p><strong>Password:</strong> Your password has been changed.</p>' : ''}
                <p>If you did not make these changes, please contact our support team immediately.</p>
                <p>For any questions or concerns, please don't hesitate to reach out to us at <a href="mailto:support@ido.company">support@ido.company</a>.</p>
                <p>Thank you for using IDO!</p>
                <p>Best regards,<br>The IDO Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 IDO. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id, role, CompanyType } = req.body;

    let user;
    let userEmail;
    let userName;

    if (role === 'superadmin') {
      user = await SuperAdmin.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'Super Admin not found' });
      }
      userEmail = user.Email;
      userName = user.Name;
    } else if (CompanyType === 'Gaap') {
      user = await GaapUser.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'GAAP User not found' });
      }
      userEmail = user.email;
      userName = user.username;
      await Business.findOneAndDelete({ AdminID: id });
    } else {
      user = await Admin.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      userEmail = user.Email;
      userName = user.Name;
      await Business.findOneAndDelete({ AdminID: id });
    }

    const mailOptions = {
      from: process.env.Email_Sender,
      to: userEmail,
      subject: 'Your IDO Account Has Been Deleted',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Deletion Notification</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              text-align: center;
              padding: 20px 0;
            }
            .logo {
              max-width: 150px;
              height: auto;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            h1, h2 {
              color: #2c3e50;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 0.9em;
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://firebasestorage.googleapis.com/v0/b/crem-40ccb.appspot.com/o/images%2Fido-logo.png?alt=media" alt="IDO Logo" class="logo">
            </div>
            <div class="content">
              <h1>Account Deletion Notification</h1>
              <p>Dear ${userName},</p>
              <p>We regret to inform you that your IDO account has been deleted.</p>
              <p>If you believe this action was taken in error or if you have any questions, please contact our support team immediately at <a href="mailto:support@ido.company">support@ido.company</a>.</p>
              <p>Thank you for your time with IDO. We wish you all the best in your future endeavors.</p>
              <p>Best regards,<br>The IDO Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 IDO. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowercaseEmail = email.toLowerCase(); // Convert email to lowercase

    let user;
    let secretKey;
    let features = null;
    let totals = null;
    let business = null;

    // Check GAAP User
    user = await GaapUser.findOne({ email: { $regex: new RegExp(`^${lowercaseEmail}$`, 'i') } });
    console.log(user)
    if (user) {
      secretKey = user.role === 'admin' ? process.env.JWT_SECRET_GAAP : process.env.JWT_SECRET_GAAP_USER;
      business = await Business.findOne({ AdminID: user._id });
    } else {
      // Check SuperAdmin
      user = await SuperAdmin.findOne({ Email: { $regex: new RegExp(`^${lowercaseEmail}$`, 'i') } });
      if (user) {
        secretKey = process.env.JWT_SECRET_Super;
      } else {
        // Check Admin
        user = await Admin.findOne({ Email: { $regex: new RegExp(`^${lowercaseEmail}$`, 'i') } });
        if (user) {
          secretKey = process.env.JWT_SECRET;
          // Find associated business for Admin
          business = await Business.findOne({ AdminID: user._id });
          console.log("yes")
        } else {
          // Check Vendor
          user = await Vendor.findOne({ 'contactInformation.email': { $regex: new RegExp(`^${lowercaseEmail}$`, 'i') } });
          if (user) {
            secretKey = process.env.JWT_SECRET_VENDOR;
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if GAAP user is active
    if (user.constructor.modelName === 'GaapUser' && !user.isActive) {
      return res.status(403).json({ message: 'Account is inactive. Please contact an administrator.' });
    }

    // Check payment status for non-superadmin and non-vendor users
    if (user.role !== 'superadmin' && user.role !== 'vendor' && user.constructor.modelName !== 'GaapUser') {
      const payment = await Payment.findOne({ UserID: user._id });
      console.log(payment);
      // Uncomment the following lines if you want to enforce payment check
      // if (!payment || payment.Status === 'Pending' || payment.Status === 'Failed') {
      //   return res.status(404).json({ message: 'Payment not completed' });
      // }

      // Extract features and totals from the payment
      if (payment) {
        features = payment.Features;
        totals = {
          TotalStaff: payment.TotalStaff,
          TotalExpenses: payment.TotalExpenses,
          TotalCustomers: payment.TotalCustomers,
          TotalSocialMediaPosts: payment.TotalSocialMediaPosts
        };
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username || user.Name || user.name,
        email: user.email || user.Email || user.contactInformation.email,
        role: user.role
      },
      secretKey,
      { expiresIn: '30d' }
    );

    // Update last login for GAAP users
    if (user.constructor.modelName === 'GaapUser') {
      user.lastLogin = new Date();
      await user.save();
    }

    const response = {
      message: 'Login successful',
      token,
      role: user.role,
      features,
      totals,
      user: {
        id: user._id,
        username: user.username || user.Name || user.name,
        email: user.email || user.Email || user.contactInformation.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department || ''
      }
    };

    if (business) {
      response.business = business;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};








module.exports = { signup, signin, updateUser, deleteUser };
