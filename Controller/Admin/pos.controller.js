// controllers/userBusinessController.js

const POSUser = require('../../Model/POS/posUser');
const POSBusiness = require('../../Model/POS/PosBusiness');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');

// Create transporter outside the function to reuse it
const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);




const createUserAndBusiness = async (req, res) => {
  try {
    const {
      username, email, password, role, fullName,
      businessName, BusinessAddress, BusinessPhoneNo, BusinessEmail,
      OwnerName, YearofEstablishment, BusinessType, CompanyType, CompanyActivity
    } = req.body;

    // Check if business name is unique
    const existingBusiness = await POSBusiness.findOne({ BusinessName: businessName });
    if (existingBusiness) {
      return res.status(400).json({ message: 'Business name already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new POSUser({
      username,
      email,
      password: hashedPassword,
      role,
      fullName
    });

    const savedUser = await newUser.save();

    // Create business
    const newBusiness = new POSBusiness({
      AdminID: savedUser._id,
      BusinessName: businessName,
      BusinessAddress,
      BusinessPhoneNo,
      BusinessEmail,
      OwnerName,
      YearofEstablishment,
      BusinessType,
      CompanyType,
      CompanyActivity
    });

    const savedBusiness = await newBusiness.save();

    // Make POST request to external API with timeout and retry logic
    let apiResponse;
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        apiResponse = await axios.post('https://mediumaquamarine-stingray-773000.hostingersite.com/api/create-user', null, {
          params: {
            email,
            password,
            business_name: businessName,
            user_name: username
          },
          timeout: 10000 // 10 seconds timeout
        });
        break; // If successful, break out of the loop
      } catch (error) {
        if (i === maxRetries - 1) throw error; // If all retries failed, throw the error
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      }
    }

    // Update user with businessPhpId
    savedUser.businessPhpId = apiResponse.data.id;
    await savedUser.save();

    // Send welcome email
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
              
              <a href="https://mediumaquamarine-stingray-773000.hostingersite.com" class="btn">Log In to Your Account</a>
              
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

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'User and Business created successfully, welcome email sent',
      user: savedUser,
      business: savedBusiness
    });

  } catch (error) {
    console.error('Error in createUserAndBusiness:', error);
    if (error.response) {
      console.error('External API error:', error.response.data);
      console.error('External API status:', error.response.status);
      console.error('External API headers:', error.response.headers);
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
      return res.status(503).json({ message: 'External service is currently unavailable. Please try again later.' });
    }
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};

const updateUserAndBusiness = async (req, res) => {
  try {
    const { userId } = req.body;
    const updateData = req.body;
    console.log(updateData)
    // Find the user
    const user = await POSUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the associated business
    const business = await POSBusiness.findOne({ AdminID: userId });
    if (!business) {
      return res.status(404).json({ message: 'Associated business not found' });
    }

    // Check if business name is being updated and ensure it's unique
    if (updateData.BusinessName && updateData.BusinessName !== business.BusinessName) {
      const existingBusiness = await POSBusiness.findOne({ BusinessName: updateData.BusinessName });
      if (existingBusiness) {
        return res.status(400).json({ message: 'Business name already exists' });
      }
    }

    // Update user fields
    const userFields = ['username', 'email', 'fullName', 'role', 'department', 'phoneNumber', 'address'];
    userFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    // Handle password update separately
    if (updateData.password) {
      user.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update business fields
    const businessFields = ['BusinessName', 'BusinessAddress', 'BusinessPhoneNo', 'BusinessEmail', 'OwnerName', 'YearofEstablishment', 'BusinessType', 'CompanyType', 'CompanyActivity'];
    businessFields.forEach(field => {
      if (updateData[field] !== undefined) {
        business[field] = updateData[field];
      }
    });

    // Save updated user and business
    await user.save();
    await business.save();

    // Make POST request to external API with retry logic
    const maxRetries = 3;
    let apiResponse;
    for (let i = 0; i < maxRetries; i++) {
      try {
        apiResponse = await axios.post('https://mediumaquamarine-stingray-773000.hostingersite.com/api/update-user', null, {
          params: {
            email: user.email,
            password: updateData.password || user.password,
            business_name: business.BusinessName,
            id: user.businessPhpId,
            user_name: updateData.username || user.username
          },
          timeout: 10000 // 10 seconds timeout
        });
        break; // If successful, break out of the loop
      } catch (error) {
        if (i === maxRetries - 1) throw error; // If all retries failed, throw the error
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      }
    }

    // Check if email or password was updated
    const emailChanged = updateData.email && updateData.email !== user.email;
    const passwordChanged = updateData.password !== undefined;

    if (emailChanged || passwordChanged) {
      // Send update notification email
      const mailOptions = {
        from: process.env.Email_Sender,
        to: user.email,
        subject: 'Your IDO Account Has Been Updated',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Update Notification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
              .content { background-color: #ffffff; padding: 20px; border-radius: 5px; }
              .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Account Update Notification</h1>
              </div>
              <div class="content">
                <p>Dear ${user.username},</p>
                <p>Your IDO account has been successfully updated.</p>
                ${emailChanged ? `<p>Your new email address is: ${user.email}</p>` : ''}
                ${passwordChanged ? '<p>Your password has been changed.</p>' : ''}
                <p>If you did not make these changes, please contact our support team immediately at <a href="mailto:support@ido.company">support@ido.company</a>.</p>
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

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({
      message: 'User and Business updated successfully',
      user: user,
      business: business
    });

  } catch (error) {
    console.error('Error in updateUserAndBusiness:', error);
    if (error.response) {
      console.error('External API error:', error.response.data);
      console.error('External API status:', error.response.status);
      console.error('External API headers:', error.response.headers);
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
      return res.status(503).json({ message: 'External service is currently unavailable. Please try again later.' });
    }
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};
const deleteUserAndBusiness = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the user
    const user = await POSUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const businessPhpId = user.businessPhpId;

    // Find and delete the associated business
    const deletedBusiness = await POSBusiness.findOneAndDelete({ AdminID: userId });
    if (!deletedBusiness) {
      return res.status(404).json({ message: 'Associated business not found' });
    }

    // Delete the user
    await POSUser.findByIdAndDelete(userId);

    // Make POST request to external API with retry logic
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.post('https://mediumaquamarine-stingray-773000.hostingersite.com/api/delete-user', null, {
          params: {
            id: businessPhpId
          },
          timeout: 10000 // 10 seconds timeout
        });
        break; // If successful, break out of the loop
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error.message);
        if (i === maxRetries - 1) {
          // If all retries failed, log the error but don't throw it
          console.error('All attempts to delete user from external API failed');
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        }
      }
    }

    // Send deletion notification email
    try {
      const mailOptions = {
        from: process.env.Email_Sender,
        to: user.email,
        subject: 'Your IDO Account Has Been Deleted',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deletion Notification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
              .content { background-color: #ffffff; padding: 20px; border-radius: 5px; }
              .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Account Deletion Notification</h1>
              </div>
              <div class="content">
                <p>Dear ${user.username},</p>
                <p>Your IDO account and associated business data have been successfully deleted from our system.</p>
                <p>If you did not request this deletion, please contact our support team immediately at <a href="mailto:support@ido.company">support@ido.company</a>.</p>
                <p>We're sorry to see you go and hope you'll consider using our services again in the future.</p>
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

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Error sending deletion notification email:', emailError);
    }

    res.status(200).json({
      message: 'User and associated business deleted successfully',
      deletedUserId: userId,
      deletedBusinessId: deletedBusiness._id
    });

  } catch (error) {
    console.error('Error in deleteUserAndBusiness:', error);
    if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
      return res.status(503).json({ message: 'External service is currently unavailable. Please try again later.' });
    }
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
};
const getAllUsersWithBusinesses = async (req, res) => {
  try {
    const users = await POSUser.find({});

    const usersWithBusinesses = await Promise.all(users.map(async (user) => {
      const userData = user.toObject();
      delete userData.password;

      const business = await POSBusiness.findOne({ AdminID: user._id });

      return {
        user: userData,
        business: business ? business.toObject() : null
      };
    }));

    res.status(200).json({
      message: 'All users and their businesses retrieved successfully',
      data: usersWithBusinesses
    });

  } catch (error) {
    console.error('Error in getAllUsersWithBusinesses:', error);
    res.status(500).json({ message: 'An error occurred while retrieving the data' });
  }
}

module.exports = { updateUserAndBusiness, createUserAndBusiness, deleteUserAndBusiness, getAllUsersWithBusinesses }