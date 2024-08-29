const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY
  })
);

const addInvoice = async (req, res) => {
  try {
    const { projectId, invoiceDetails,paymentOption } = req.body;

    // Find the project
    const project = await GaapProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const user = await GaapUser.findById(req.adminId);

    // Create a new invoice object
    const newInvoice = new GaapInvoice({
      ...invoiceDetails,
      customer: project.customer,
      project: projectId,
      createdBy: req.adminId,
      teamId: user.teamId
    });

    // Validate the invoice
    const validationError = newInvoice.validateSync();
    if (validationError) {
      return res.status(400).json({ message: 'Invalid invoice data', errors: validationError.errors });
    }
    
    // Save the invoice
    await newInvoice.save();

    // Update the project with the new invoice
    project.invoices.push(newInvoice._id);
    await project.save();

    // Update or create ProjectPayment
    let projectPayment = await ProjectPayment.findOne({ project: projectId });
    
    if (!projectPayment) {
      projectPayment = new ProjectPayment({
        paymentOption:paymentOption,
        project: projectId,
        customer: project.customer,
        totalAmount: project.totalAmount,
        createdBy: req.adminId
      });
    }

    // Update ProjectPayment
    projectPayment.invoices.push(newInvoice._id);
    projectPayment.totalAmount = Math.max(projectPayment.totalAmount, newInvoice.total);
    projectPayment.unpaidAmount = projectPayment.totalAmount - projectPayment.paidAmount;

    // Add to payment schedule if not already included
    const existingSchedule = projectPayment.paymentSchedule.find(
      schedule => schedule.dueDate.getTime() === newInvoice.dueDate.getTime()
    );

    if (!existingSchedule) {
      projectPayment.paymentSchedule.push({
        dueDate: newInvoice.dueDate,
        amount: newInvoice.total,
        status: 'Pending'
      });
    } else {
      existingSchedule.amount += newInvoice.total;
    }

    projectPayment.updatePaymentStatus();
    await projectPayment.save();

    // Fetch customer details
    const customer = await GaapCustomer.findById(project.customer);

    // Send email to customer
    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice for ${project.projectName}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #4CAF50;
                color: white;
                text-align: center;
                padding: 20px;
                margin-bottom: 20px;
            }
            .content {
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                padding: 20px;
                border-radius: 5px;
            }
            .invoice-details {
                background-color: #fff;
                border: 1px solid #eee;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 5px;
            }
            .invoice-details ul {
                list-style-type: none;
                padding: 0;
            }
            .invoice-details li {
                margin-bottom: 10px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.9em;
                color: #777;
            }
            .button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 15px;
            }
        </style>
    head>
    <body>
        <div class="header">
            <h1>Invoice for Project: ${project.projectName}</h1>
        </div>
        <div class="content">
            <p>Dear companyName,</p>
            <p>We hope this email finds you well. Please find below the details of your invoice for the project "${project.projectName}".</p>
            
            <div class="invoice-details">
                <h3>Invoice Details:</h3>
                <ul>
                    <li><strong>Invoice Number:strong> ${newInvoice.invoiceNumber}</li>
                    <li><strong>Issue Date:</strong> ${newInvoice.issueDate.toDateString()}</li>
                    <li><strong>Due Date:</strong> ${newInvoice.dueDate.toDateString()}</li>
                    <li> Amount:</strong> ${newInvoice.total.toFixed(2)} ${newInvoice.currency}</li>
                </ul>
            </div>
    
            <p>We kindly request that you ensure the payment is made by the due date. If you have any questions or concerns regarding this invoice, please don't hesitate to reach out to us.</p>
            
            <a href="#" class="button">View Full Invoice</a>
    
            <p>We sincerely appreciate your business and look forward to continuing our successful partnership.</p>
            
            <p>Best regards,<br><strong>${user.name}</strong><br>${user.designation || 'Project Manager'}</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
    

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customer.contactPerson1.email,
      subject: `Invoice ${newInvoice.invoiceNumber} for ${project.projectName}`,
      html: emailTemplate
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({
      message: 'Invoice created successfully and email sent to customer',
      invoice: newInvoice,
      projectPayment: projectPayment
    });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ message: 'Error adding invoice', error: error.message });
  }
};

module.exports = {
  addInvoice
};
