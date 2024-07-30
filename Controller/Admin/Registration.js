const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
const Vendor = require('../../Model/vendorSchema');
const Business = require('../../Model/Business');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Payment = require('../../Model/Payment');

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

    // Send welcome email with username and password
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
                <p><strong>Password:strong> ${password}</p>
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
                <li>Log In:</strong> Use your credentials to access your account.</li>
                <li>Explore:</strong> Take a tour of our platform and discover its features.</li>
                <li><strong>Get Started:</strong> Begin managing your business more efficiently.</li>
              </ol>
              
              <p>If you need any assistance, please don't hesitate to contact our support team at <a href="mailto:support@ido.company">support@ido.company</a>.p>
              
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
    if (role === 'superadmin') {
      user = await SuperAdmin.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Super Admin not found' });
      }
    } else {
      user = await Admin.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }
    }

    if (username) user.Name = username;
    if (email) user.Email = email;
    if (password) user.Password = await bcrypt.hash(password, 10);

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

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { id, role } = req.body;

    let user;
    if (role === 'superadmin') {
      user = await SuperAdmin.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'Super Admin not found' });
      }
    } else {
      user = await Admin.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      await Business.findOneAndDelete({ AdminID: id });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user;
    let secretKey;
    let features = null;
    let totals = null;
    let business = null;

    user = await SuperAdmin.findOne({ Email: email });
    if (user) {
      secretKey = process.env.JWT_SECRET_Super;
    } else {
      user = await Admin.findOne({ Email: email });
      if (user) {
        secretKey = process.env.JWT_SECRET;
        // Find associated business for Admin
        business = await Business.findOne({ AdminID: user._id });
      } else {
        user = await Vendor.findOne({ 'contactInformation.email': email });
        if (user) {
          secretKey = process.env.JWT_SECRET_VENDOR;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.Password || user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(user.role)

    if (user.role != 'superadmin' && user.role != 'vendor') {
      const payment = await Payment.findOne({ UserID: user._id });
      console.log(payment);
      // if (!payment || payment.Status === 'Pending' || payment.Status === 'Failed') {
      //   return res.status(404).json({ message: 'Payment not completed' });
      // }

      // Extract features and totals from the payment
      features = payment.Features;
      totals = {
        TotalStaff: payment.TotalStaff,
        TotalExpenses: payment.TotalExpenses,
        TotalCustomers: payment.TotalCustomers,
        TotalSocialMediaPosts: payment.TotalSocialMediaPosts
      };
    }
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.Name || user.name,
        email: user.Email || user.contactInformation.email,
        role: user.role
      },
      secretKey,
      { expiresIn: '30d' }
    );

    const response = {
      message: 'Signin successful',
      token,
      role: user.role,
      features,
      totals
    };

    if (business) {
      response.business = business;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};





module.exports = { signup, signin, updateUser, deleteUser };
