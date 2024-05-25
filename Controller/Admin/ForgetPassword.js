const Admin = require('../../Model/Admin');
const SuperAdmin = require('../../Model/superAdmin');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

function generateOTP(length) {
    const digits = '0123456789';
    let otp = '';
  
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
  
    return otp;
  }
  

  
  dotenv.config();
  const transporter = nodemailer.createTransport(
    new sendinBlue({
      apiKey: process.env.SENDINBLUE_API_KEY,
    })
  );
  
  const generateOtp = async (req, res) => {
    try {
      const { email } = req.body;
  
      let user = await Admin.findOne({ Email: email });
  
      if (!user) {
        user = await SuperAdmin.findOne({ Email: email });
      }
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Generate OTP
      const otp = generateOTP(6);
  
      user.Otp = otp;
      user.OtpVerified = false;
      await user.save();
  
      const mailOptions = {
        from: process.env.Email_Sender,
        to: email,
        subject: 'OTP Verification',
        html: `<div>
                 <p>Your OTP for verification is:</p>
                 <h2>${otp}</h2>
                 <p>Please enter this OTP to complete the verification process.</p>
               </div>`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
          return res.status(500).json({ message: 'Failed to send OTP email' });
        } else {
          console.log('Email sent:', info.response);
          res.status(200).json({ message: 'OTP generated and sent successfully' });
        }
      });
    } catch (error) {
      console.error('Error generating OTP:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    let user = await Admin.findOne({ Email: email });

    if (!user) {
      user = await SuperAdmin.findOne({ Email: email });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.Otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.OtpVerified = true;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




const updatePassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists in the Admin model
    let user = await Admin.findOne({ Email: email });

    // If user not found in Admin model, check in SuperAdmin model
    if (!user) {
      user = await SuperAdmin.findOne({ Email: email });
    }

    // If user not found in both models, return an error
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if(user.OtpVerified===false){
      return res.status(404).json({ message: 'Verify Otp First' });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.Password = hashedPassword;
    await user.save();


    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { verifyOtp,generateOtp,updatePassword };
