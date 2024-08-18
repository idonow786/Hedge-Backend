
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../Model/Gaap/gaap_team');

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
      companyActivity
    } = req.body;
    console.log("Body  ",req.body)
    // if (req.role !== 'admin') {
    //   return res.status(403).json({ message: 'You do not have permission to add users' });
    // }

    // Check if user already exists
    const existingUser = await GaapUser.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
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
      createdBy:req.adminId
    });



    // Find the GAAP team and update it
    console.log('gaap team ', await GaapTeam.find())
    const gaapTeam = await GaapTeam.findOne({ 'parentUser.userId': req.adminId });
    if (gaapTeam) {
      const newMember = {
        memberId: newUser._id,
        name: fullName,
        role: role,
        department: department,
        managerId: manager ? manager : ''
      };
      gaapTeam.members.push(newMember);
      await gaapTeam.save();
      console.log('GaapTeam ',gaapTeam)
      newUser.teamId=gaapTeam._id
    }
    // Save user
    await newUser.save();
    console.log("newUser ",newUser)

    const mailOptions = {
      from: process.env.Email_Sender,
      to: email,
      subject: 'Welcome to GAAP Associates Software',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to GAAP Associates Software</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; border-radius: 5px;">
            <tr>
              <td style="padding: 20px;">
                <h1 style="color: #2c3e50; text-align: center;">Welcome to GAAP Associates Software</h1>
                <p style="font-size: 16px;">Dear ${fullName},</p>
                <p style="font-size: 16px;">Your account has been successfully created with the following details:</p>
                <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #ffffff; border-radius: 5px; margin-bottom: 20px;">
                  <tr>
                    <td style="border-bottom: 1px solid #eee;"><strong>Username:</strong></td>
                    <td style="border-bottom: 1px solid #eee;">${username}</td>
                  </tr>
                  <tr>
                    <td style="border-bottom: 1px solid #eee;"><strong>Role:</strong></td>
                    <td style="border-bottom: 1px solid #eee;">${role}</td>
                  </tr>
                  <tr>
                    <td><strong>Department:</strong></td>
                    <td>${department}</td>
                  </tr>
                </table>
                <p style="font-size: 16px;">You can now log in to your account using your email and password.</p>
                <p style="font-size: 16px;">If you have any questions, please don't hesitate to contact us.</p>
                <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>GAAP Associates Team</p>
              </td>
            </tr>
          </table>
          <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
            This is an automated message, please do not reply directly to this email.
          </p>
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


module.exports={registerUser}