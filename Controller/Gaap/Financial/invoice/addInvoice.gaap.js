const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const handlebars = require('handlebars');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY
  })
);

const addInvoice = async (req, res) => {
  try {
    const { projectId, invoiceDetails, paymentOption } = req.body;

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

    // Ensure that the total, subtotal, and taxTotal are set correctly
    newInvoice.total = invoiceDetails.total || 0;
    newInvoice.subtotal = invoiceDetails.subtotal || 0;
    newInvoice.taxTotal = invoiceDetails.taxTotal || 0;

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
        paymentOption: paymentOption,
        project: projectId,
        customer: project.customer,
        totalAmount: project.totalAmount,
        createdBy: req.adminId,
        teamId: user.teamId
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

    // Generate PDF
    const pdfBuffer = await generatePDF(newInvoice, project, customer, user);

    // Send email to customer
    await sendEmail(user, customer, project, newInvoice, pdfBuffer);

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

const generatePDF = async (invoice, project, customer, user) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const safeString = (value) => value === undefined || value === null || Number.isNaN(value) ? '' : String(value);

  // Colors
  const primaryColor = rgb(0.1, 0.4, 0.7);
  const secondaryColor = rgb(0.8, 0.8, 0.8);

  // Helper function to draw text
  const drawText = (text, x, y, size, fontToUse = font, color = rgb(0, 0, 0)) => {
    page.drawText(safeString(text), { x, y, size, font: fontToUse, color });
  };

  // Add logo
  try {
    const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/tempproject-4cb9b.appspot.com/o/logo.png?alt=media';
    const logoImageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const logoDims = logoImage.scale(0.5);
    page.drawImage(logoImage, {
      x: 50,
      y: height - 120,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  // Header
  drawText('INVOICE', width - 150, height - 50, 30, boldFont, primaryColor);
  drawText(`Invoice Number: ${invoice.invoiceNumber}`, width - 200, height - 80, 12);
  drawText(`Issue Date: ${invoice.issueDate ? invoice.issueDate.toDateString() : 'N/A'}`, width - 200, height - 100, 12);
  drawText(`Due Date: ${invoice.dueDate ? invoice.dueDate.toDateString() : 'N/A'}`, width - 200, height - 120, 12);

  // Project Details
  let yPos = height - 180;
  drawText('Project Details:', 50, yPos, 16, boldFont, primaryColor);
  yPos -= 25;
  drawText(`Project Name: ${project.projectName}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`Project Type: ${project.projectType}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`Department: ${project.department}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`Description: ${project.description}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`Start Date: ${project.startDate ? project.startDate.toDateString() : 'N/A'}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`End Date: ${project.endDate ? project.endDate.toDateString() : 'N/A'}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`Status: ${project.status}`, 50, yPos, 12);
  yPos -= 20;
  drawText(`Total Project Amount: ${project.totalAmount.toFixed(2)} ${invoice.currency}`, 50, yPos, 12);

  // Customer Info
  yPos -= 40;
  drawText('Bill To:', 50, yPos, 16, boldFont, primaryColor);
  yPos -= 25;
  drawText(customer.companyName, 50, yPos, 12);
  yPos -= 20;
  drawText(customer.address, 50, yPos, 12);

  // Invoice Items Table
  yPos -= 40;
  const tableTop = yPos;
  const tableLeft = 50;
  const columnWidths = [250, 80, 100, 100];

  // Table Header
  page.drawRectangle({
    x: tableLeft,
    y: tableTop - 30,
    width: 530,
    height: 30,
    color: secondaryColor,
  });

  const headers = ['Description', 'Quantity', 'Unit Price', 'Amount'];
  headers.forEach((header, index) => {
    drawText(header, tableLeft + columnWidths.slice(0, index).reduce((a, b) => a + b, 0) + 10, tableTop - 20, 12, boldFont);
  });

  // Table Rows
  let currentY = tableTop - 30;
  invoice.items.forEach((item, index) => {
    currentY -= 25;
    if (index % 2 === 0) {
      page.drawRectangle({
        x: tableLeft,
        y: currentY,
        width: 530,
        height: 25,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    drawText(item.description, tableLeft + 10, currentY + 7, 10);
    drawText(item.quantity, tableLeft + columnWidths[0] + 10, currentY + 7, 10);
    drawText(item.unitPrice.toFixed(2), tableLeft + columnWidths[0] + columnWidths[1] + 10, currentY + 7, 10);
    drawText(item.amount.toFixed(2), tableLeft + columnWidths[0] + columnWidths[1] + columnWidths[2] + 10, currentY + 7, 10);
  });

  // Totals
  currentY -= 30;
  drawText(`Subtotal:`, tableLeft + 330, currentY, 12, boldFont);
  drawText(`${invoice.subtotal.toFixed(2)} ${invoice.currency}`, tableLeft + 450, currentY, 12);
  currentY -= 20;
  drawText(`Tax:`, tableLeft + 330, currentY, 12, boldFont);
  drawText(`${invoice.taxTotal.toFixed(2)} ${invoice.currency}`, tableLeft + 450, currentY, 12);
  currentY -= 20;
  page.drawLine({
    start: { x: tableLeft + 330, y: currentY + 15 },
    end: { x: tableLeft + 530, y: currentY + 15 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  drawText(`Total:`, tableLeft + 330, currentY, 14, boldFont, primaryColor);
  drawText(`${invoice.total.toFixed(2)} ${invoice.currency}`, tableLeft + 450, currentY, 14, boldFont, primaryColor);

  // Footer
  const footerY = 50;
  page.drawLine({
    start: { x: 50, y: footerY + 30 },
    end: { x: width - 50, y: footerY + 30 },
    thickness: 1,
    color: secondaryColor,
  });
  drawText(`Thank you for your business!`, 50, footerY, 12, boldFont);
  drawText(`${user.name} | ${user.designation || 'Project Manager'}`, 50, footerY - 20, 10);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};


const sendEmail = async (user, customer, project, invoice, pdfBuffer) => {
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
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 0.9em;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Invoice for Project: ${project.projectName}</h1>
        </div>
        <div class="content">
            <p>Dear ${customer.companyName},</p>
            <p>Please find attached the invoice for your project "${project.projectName}".</p>
            <p>Invoice Details:</p>
            <ul>
                <li>Invoice Number: ${invoice.invoiceNumber}</li>
                <li>Issue Date: ${invoice.issueDate.toDateString()}</li>
                <li>Due Date: ${invoice.dueDate.toDateString()}</li>
                <li>Total Amount: ${invoice.total.toFixed(2)} ${invoice.currency}</li>
            </ul>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>${user.name}<br>${user.designation || 'Project Manager'}</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </body>
    </html>
  `;

  const template = handlebars.compile(emailTemplate);
  const htmlToSend = template();
  console.log(customer.contactPerson1.email)
  const mailOptions = {
    from: user.email,
    to: 'hashmiosama555@gmail.com',
    subject: `Invoice ${invoice.invoiceNumber} for ${project.projectName}`,
    html: htmlToSend,
    attachments: [
      {
        filename: `Invoice_${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  addInvoice
};