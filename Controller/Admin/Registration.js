const Admin = require('../../Model/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');

dotenv.config();
// Create a transporter
const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

// Signup controller
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ Email: email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      Name: username,
      Email: email,
      Password: hashedPassword,
    });

    const savedAdmin = await newAdmin.save();

    // Send welcome email
    const mailOptions = {
      from: process.env.Email_Sender,
      to: email,
      subject: 'Welcome to our CRM', 
      html: `<div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; font-family: Arial, sans-serif;"> <h2 style="color: #333; margin-bottom: 10px;">Welcome ${username},</h2> <p style="color: #666; font-size: 16px;">We're glad to have you on board.</p> </div>`, 
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ message: 'Admin created successfully', admin: savedAdmin });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Signin controller
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ Email: email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin._id, username: admin.Name, email: admin.Email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({ message: 'Signin successful', token });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports={signup,signin}