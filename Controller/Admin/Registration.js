const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
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
    const { username, email, password, role, businessName } = req.body;
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
      });

      await newBusiness.save();
    }

    // Send welcome email with username and password
    const mailOptions = {
      from: process.env.Email_Sender,
      to: email,
      subject: 'Welcome to our CRM',
      html: `<div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif;">
               <h2 style="color: #333; margin-bottom: 10px;">Welcome ${username},</h2>
               <p style="color: #666; font-size: 16px;">We're glad to have you on board.</p>
               <p style="color: #666; font-size: 16px;">Your login credentials are:</p>
               <ul style="color: #666; font-size: 16px;">
                 <li>Username: ${username}</li>
                 <li>Password: ${password}</li>
               </ul>
             </div>`,
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

// Signin controller
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user;
    let secretKey;

    user = await SuperAdmin.findOne({ Email: email });
    if (user) {
      secretKey = process.env.JWT_SECRET_Super;
    } else {
      user = await Admin.findOne({ Email: email });
      secretKey = process.env.JWT_SECRET;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.role != 'superadmin') {
      const payment = await Payment.findOne({ UserID: user._id });
      if (!payment || payment.Status === 'Pending' || payment.Status === 'Failed') {
        return res.status(404).json({ message: 'Payment not completed' });
      }
    }

    const token = jwt.sign(
      { userId: user._id, username: user.Name, email: user.Email, role: user.role },
      secretKey,
      { expiresIn: '30d' }
    );

    res.status(200).json({ message: 'Signin successful', token, role: user.role });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { signup, signin };
