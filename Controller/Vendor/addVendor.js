const Vendor = require('../models/Vendor'); // Adjust the path as needed
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

const addVendor = async (req, res) => {
  try {
    const { name, email, phoneNo, address, companyName } = req.body;

    const password = generateRandomPassword();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = new Vendor({
      name,
      role: 'Vendor', 
      contactInformation: {
        email,
        phone: phoneNo,
        address,
        companyname: companyName,
      },
      password: hashedPassword,
    });

    await newVendor.save();

    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: email,
      subject: 'Your Vendor Account Details',
      html: `
        <div>
          <h2>Welcome to Our Platform!</h2>
          <p>Your vendor account has been created successfully.</p>
          <p>Here are your login details:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:strong> ${password}</p>
          <p>Please change your password after your first login.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Vendor created but failed to send email' });
      } else {
        console.log('Email sent:', info.response);
        res.status(201).json({ message: 'Vendor created and email sent successfully' });
      }
    });

  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addVendor };
