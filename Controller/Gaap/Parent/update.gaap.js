const GaapUser = require('../../../Model/Gaap/gaap_user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

const updateUser = async (req, res) => {
    try {
        const { userId, ...updateData } = req.body;
        const adminId = req.adminId; 

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find the user to be updated
        const userToUpdate = await GaapUser.findById(userId);

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the requester is an admin or the creator of the user
        const requester = await GaapUser.findById(adminId);

        if (req.role !== 'admin' && (!userToUpdate.createdBy || !userToUpdate.createdBy.equals(adminId))) {
            return res.status(403).json({ 
                message: 'You do not have permission to update this user. Only admins or the user who created this account can update it.' 
            });
        }

        let emailChanged = false;
        let passwordChanged = false;

        // Handle password update
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
            passwordChanged = true;
        }

        // Check if email is being updated
        if (updateData.email && updateData.email !== userToUpdate.email) {
            emailChanged = true;
        }

        // Proceed with update
        const updatedUser = await GaapUser.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        // Send email notifications
        if (emailChanged || passwordChanged) {
            const mailOptions = {
                from: process.env.Email_Sender,
                to: updatedUser.email,
                subject: 'Your IDO Software Account Has Been Updated',
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
                          <p>Dear ${updatedUser.fullName},</p>
                          <p>Your IDO Software account has been updated with the following changes:</p>
                          <ul>
                            ${emailChanged ? `<li>Your email address has been changed to: ${updatedUser.email}</li>` : ''}
                            ${passwordChanged ? `<li>Your password has been changed</li>` : ''}
                          </ul>
                          <p>If you did not request these changes, please contact us immediately at <a href="mailto:support@ido.company">support@ido.company</a>.</p>
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
            message: 'User updated successfully', 
            user: userResponse,
            notificationSent: emailChanged || passwordChanged
        });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid update data', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while updating user' });
    }
};

module.exports = { updateUser };