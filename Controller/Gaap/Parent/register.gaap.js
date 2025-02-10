const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../Model/Gaap/gaap_team');
const GaapBranch = require('../../../Model/Gaap/gaap_branch');

const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

const registerUser = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      manager,
      managerType,
      fullName,
      role,
      department,
      companyActivity,
      branchId
    } = req.body;
    console.log("Body  ", req.body);

    // Check if user already exists
    const existingUser = await GaapUser.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Check if branch exists
    if (branchId) {
      const branch = await GaapBranch.findOne({ _id: branchId, adminId: req.adminId });
      if (!branch) {
        return res.status(404).json({ message: 'Branch not found' });
      }
    }

    // Check user limit
    const userCount = await GaapUser.countDocuments({ createdBy: req.adminId });
    const maxUsers = 50; // Set this to the package limit

    if (userCount >= maxUsers && role !== 'Sales Executive') {
      return res.status(403).json({ 
        message: 'User limit reached. Please contact your developer company to gain access for more users.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new GaapUser({
      username,
      password: hashedPassword,
      email,
      fullName,
      role,
      manager,
      managerType,
      companyActivity,
      department,
      branchId,
      createdBy: req.adminId
    });

    console.log(req.adminId);
    console.log('User Model : ',newUser);

    // Find the GAAP team and update it
    const gaapTeam = await GaapTeam.findOne({ 'parentUser.userId': req.adminId });

    if (gaapTeam) {
      if (role === 'Audit Manager') {
        // Update the GeneralUser section
        gaapTeam.GeneralUser = {
          userId: newUser._id,
          name: fullName,
          role: role,
          branchId: branchId
        };
      } else {
        // Add to members array for other roles
        const newMember = {
          memberId: newUser._id,
          name: fullName,
          role: role,
          department: department,
          managerId: manager ? manager : ''
        };
        gaapTeam.members.push(newMember);
      }
      await gaapTeam.save();
      newUser.teamId = gaapTeam._id;
    }

    // Update branch with new user
    if (branchId) {
      await GaapBranch.findByIdAndUpdate(
        branchId,
        { $push: { users: newUser._id } }
      );
    }

    // Save user
    await newUser.save();
    console.log("newUser ", newUser);
    console.log('GaapTeam ', gaapTeam);

    const mailOptions = {
      from: process.env.Email_Sender,
      to: email,
      subject: 'Welcome to IDO Software',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to IDO Software</title>
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
              <h1>Welcome to IDO Software</h1>
              <p>Dear ${fullName},</p>
              <p>Your account has been successfully created with the following details:</p>
              <ul>
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Role:</strong> ${role}</li>
                <li><strong>Department:</strong> ${department}</li>
              </ul>
              <p>You can now log in to your account using your email and password.</p>
              <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:support@ido.company">support@ido.company</a>.>
              <p>Best regards,<br>The IDO Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 IDO. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'User registered successfully and welcome email sent',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

module.exports = { registerUser };
