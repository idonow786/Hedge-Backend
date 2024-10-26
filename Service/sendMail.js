const nodemailer = require("nodemailer");
const sendinBlue = require("nodemailer-sendinblue-transport");
const dotenv = require("dotenv");

dotenv.config();

const sendRecurringProjectEmail = async (receiverEmail, projectName, recurringDate, customerName, totalAmount, isPastDue = false) => {
  try {
    const transporter = nodemailer.createTransport(
      new sendinBlue({
        apiKey: process.env.SENDINBLUE_API_KEY,
      })
    );

    const formattedDate = new Date(recurringDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const urgencyHeader = isPastDue ? 
        `<div style="background-color: #dc3545; color: white; padding: 10px; margin-bottom: 20px; text-align: center;">
            <strong>URGENT: PAST DUE PROJECT</strong>
        </div>` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Financial Review Required</title>
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
            }
            .header {
              background-color: #1a4f7c;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px 20px;
              background-color: #ffffff;
            }
            .project-details {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #1a4f7c;
            }
            .project-details h2 {
              color: #1a4f7c;
              margin-top: 0;
              font-size: 20px;
            }
            .highlight {
              color: #1a4f7c;
              font-weight: bold;
            }
            .amount {
              font-size: 18px;
              color: #2c5282;
              font-weight: bold;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666666;
            }
            .action-button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #1a4f7c;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              font-weight: bold;
            }
            .urgent-notice {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
            }
            @media only screen and (max-width: 600px) {
              .email-container {
                width: 100%;
              }
              .content {
                padding: 20px 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            ${urgencyHeader}
            <div class="header">
              <h1>Financial Review Required</h1>
            </div>
            
            <div class="content">
              <p>Dear Finance Manager,</p>
              
              <p>This is a notification regarding an upcoming recurring project that requires your financial review and approval.</p>
              
              <div class="project-details">
                <h2>Project Information:</h2>
                <p><span class="highlight">Project Name:</span> ${projectName}</p>
                <p><span class="highlight">Client:</span> ${customerName}</p>
                <p><span class="highlight">Renewal Date:</span> ${formattedDate}</p>
                <p><span class="highlight">Project Value:</span> <span class="amount">AED ${totalAmount.toLocaleString()}</span></p>
              </div>
              
              <div class="urgent-notice">
                <p><strong>Action Required:</strong> Please review and process the following:</p>
                <ul>
                  <li>Verify project financials and payment terms</li>
                  <li>Review previous payment history</li>
                  <li>Confirm billing schedule</li>
                  <li>Check for any outstanding payments</li>
                  <li>Approve financial terms for renewal</li>
                </ul>
              </div>
              
              <p>This project requires your approval to proceed with the renewal process. Please review and provide your approval through the system at your earliest convenience.</p>
              
              <p style="margin-top: 20px;">If you notice any discrepancies or have concerns, please raise them immediately with the project manager.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from GAAP Financial Management System</p>
              <p>© ${new Date().getFullYear()} GAAP. All rights reserved.</p>
              <p>For urgent matters, please contact the Finance Department directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@gaap.ae',
      to: receiverEmail,
    //   to: 'hashmiosama555@gmail.com',
      subject: `Financial Review Required - Recurring Project: ${projectName}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email notification");
  }
};

module.exports = {
  sendRecurringProjectEmail
};
