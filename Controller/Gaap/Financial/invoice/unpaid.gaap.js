const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const handlebars = require('handlebars');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
dotenv.config();

const getProjectsWithInvoiceStatus = async (req, res) => {
  try {
    let teamId;

    if (req.role === 'admin' || req.role === 'Operation Manager') {
      const team = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': req.adminId },
          { 'GeneralUser.userId': req.adminId }
        ]
      });

      if (!team) {
        return res.status(404).json({ message: 'Team not found for the user' });
      }

      teamId = team._id;
    } else {
      const user = await GaapUser.findById(req.adminId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      teamId = user.teamId;
      console.log("teamID : ", teamId)
    }

    const projects = await GaapProject.find({
      // status: 'In Progress',
      teamId: teamId
    }).populate('customer')
      .populate('assignedTo')
      .populate('salesPerson')
      .lean();
    console.log(projects)
    const projectsWithInvoices = await Promise.all(projects.map(async (project) => {
      const payment = await ProjectPayment.findOne({ project: project._id })
        .populate('invoices')
        .lean();

      const invoices = await GaapInvoice.find({ project: project._id }).lean();

      const invoiceStatusSummary = {
        Draft: 0,
        Sent: 0,
        Paid: 0,
        Overdue: 0,
        Cancelled: 0
      };

      let totalInvoiced = 0;
      let totalPaid = 0;

      invoices.forEach(invoice => {
        invoiceStatusSummary[invoice.status]++;
        totalInvoiced += invoice.total;
        if (invoice.status === 'Paid') {
          totalPaid += invoice.total;
        }
      });

      return {
        ...project,
        payment: payment || {
          paymentStatus: 'Not Started',
          paidAmount: totalPaid,
          unpaidAmount: project.totalAmount - totalPaid
        },
        invoices: invoices,
        invoiceStatusSummary: invoiceStatusSummary,
        totalInvoiced: totalInvoiced,
        totalPaid: totalPaid,
        remainingAmount: project.totalAmount - totalPaid
      };
    }));

    res.status(200).json(projectsWithInvoices);
  } catch (error) {
    console.error('Error fetching projects with invoice status:', error);
    res.status(500).json({ message: 'Error fetching projects with invoice status', error: error.message });
  }
};


const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

const updatePayment = async (req, res) => {
  try {
    const { invoiceId, projectId, status } = req.body;
    const invoice = await GaapInvoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const project = await GaapProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let payment = await ProjectPayment.findOne({ project: projectId });
    if (!payment) {
      payment = new ProjectPayment({
        project: projectId,
        customer: project.customer,
        totalAmount: project.totalAmount,
        createdBy: req.adminId,
        teamId: project.teamId
      });
    }

    // Update invoice status
    invoice.status = status;
    await invoice.save();

    // Update payment based on invoice status
    if (status === 'Paid') {
      const paidAmount = invoice.total;
      payment.addPayment(paidAmount, new Date(), 'Bank Transfer', req.adminId, `Payment received for invoice ${invoice.invoiceNumber}`);

      if (!payment.invoices.includes(invoice._id)) {
        payment.invoices.push(invoice._id);
      }
    }

    await payment.save();

    // Update project status if fully paid
    if (payment.paymentStatus === 'Fully Paid') {
      project.status = 'Completed';
      await project.save();
    }

    // Find admin user
    const adminUser = await GaapUser.findById(req.adminId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Find customer
    const customer = await GaapCustomer.findById(project.customer);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Generate PDF and send email only if status is 'Paid'
    let emailSent = false;
    if (status === 'Paid') {
      const pdfBuffer = await generateReceiptPDF(invoice, project, customer, payment);

      try {
        await sendInvoiceEmail(
          adminUser.email,
          customer.contactPerson1.email,
          pdfBuffer,
          invoice,
          project,
          customer,
          payment
        );
        emailSent = true;

        // Check if ICV certificate should be sent
        if (payment.paymentStatus === 'Fully Paid' &&
          (project.projectType === 'ICV' || project.projectType === 'ICV+external Audit')) {
          const icvCertificateBuffer = await generateICVCertificate(project, customer);
          await sendICVCertificateEmail(
            adminUser.email,
            customer.contactPerson1.email,
            icvCertificateBuffer,
            project,
            customer
          );
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue execution even if email sending fails
      }
    }

    res.status(200).json({
      message: status === 'Paid'
        ? (emailSent ? 'Payment received and invoice sent' : 'Payment received, but there was an issue sending the invoice email')
        : `Invoice status updated to ${status}`,
      payment: {
        totalAmount: payment.totalAmount,
        paidAmount: payment.paidAmount,
        unpaidAmount: payment.unpaidAmount,
        paymentStatus: payment.paymentStatus,
        lastPaymentDate: payment.lastPaymentDate,
        nextPaymentDue: payment.nextPaymentDue
      },
      updatedInvoice: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        status: invoice.status
      },
      emailSent: emailSent
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};


async function generateReceiptPDF(invoice, project, customer, payment) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add logo
  const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/tempproject-4cb9b.appspot.com/o/logo.png?alt=media';
  const logoImageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
  const logoImage = await pdfDoc.embedPng(logoImageBytes);
  page.drawImage(logoImage, {
    x: 50,
    y: page.getHeight() - 100,
    width: 100,
    height: 50,
  });

  // Add company details
  page.drawText('GAAP Associates', { x: 50, y: page.getHeight() - 120, size: 16, font: helveticaBold });
  page.drawText('Abu Dhabi, UAE', { x: 50, y: page.getHeight() - 140, size: 10, font: helvetica });
  page.drawText('Phone: 02 650 2924 | Email: info@gaapaudit.com', { x: 50, y: page.getHeight() - 155, size: 10, font: helvetica });

  // Add receipt title
  page.drawText('RECEIPT', { x: 250, y: page.getHeight() - 100, size: 24, font: helveticaBold, color: rgb(0.2, 0.4, 0.6) });

  // Add receipt details
  page.drawText(`Receipt #: ${invoice.invoiceNumber}`, { x: 400, y: page.getHeight() - 130, size: 12, font: helveticaBold });
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 400, y: page.getHeight() - 150, size: 12, font: helvetica });

  // Add customer details
  page.drawText('Received From:', { x: 50, y: page.getHeight() - 200, size: 14, font: helveticaBold });
  page.drawText(customer.companyName, { x: 50, y: page.getHeight() - 220, size: 12, font: helvetica });
  page.drawText(customer.address.street, { x: 50, y: page.getHeight() - 235, size: 10, font: helvetica });
  page.drawText(`${customer.address.city}, ${customer.address.country}`, { x: 50, y: page.getHeight() - 250, size: 10, font: helvetica });

  // Add payment details
  let currentY = page.getHeight() - 300;
  page.drawText('Payment Details:', { x: 50, y: currentY, size: 14, font: helveticaBold });
  currentY -= 25;
  page.drawText(`Project Name: ${project.projectName}`, { x: 50, y: currentY, size: 12, font: helvetica });
  currentY -= 20;
  page.drawText(`Amount Received: ${invoice.total.toFixed(2)} ${invoice.currency}`, { x: 50, y: currentY, size: 12, font: helveticaBold });
  currentY -= 20;
  page.drawText(`Payment Method: Bank Transfer`, { x: 50, y: currentY, size: 12, font: helvetica });
  currentY -= 20;
  page.drawText(`Payment Date: ${new Date().toLocaleDateString()}`, { x: 50, y: currentY, size: 12, font: helvetica });

  // Add project payment summary
  currentY -= 40;
  page.drawText('Project Payment Summary:', { x: 50, y: currentY, size: 14, font: helveticaBold });
  currentY -= 25;
  page.drawText(`Total Project Amount: ${payment.totalAmount.toFixed(2)} ${payment.currency}`, { x: 50, y: currentY, size: 12, font: helvetica });
  currentY -= 20;
  page.drawText(`Total Paid Amount: ${payment.paidAmount.toFixed(2)} ${payment.currency}`, { x: 50, y: currentY, size: 12, font: helvetica });
  currentY -= 20;
  page.drawText(`Remaining Amount: ${payment.unpaidAmount.toFixed(2)} ${payment.currency}`, { x: 50, y: currentY, size: 12, font: helvetica });
  currentY -= 20;
  page.drawText(`Payment Status: ${payment.paymentStatus}`, { x: 50, y: currentY, size: 12, font: helvetica });

  // Add footer
  const footerY = 50;
  page.drawText('Thank you for your payment!', { x: 50, y: footerY, size: 12, font: helveticaBold, color: rgb(0.2, 0.4, 0.6) });
  page.drawText('This receipt is proof of payment for the services rendered.', { x: 50, y: footerY - 15, size: 10, font: helvetica });

  return await pdfDoc.save();
}
async function sendInvoiceEmail(fromEmail, toEmail, pdfBuffer, invoice, project, customer, payment) {
  const emailTemplate = handlebars.compile(`
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Receipt for Project: {{projectName}}</h2>
        <p>Dear {{customerName}},</p>
        <p>Please find attached the receipt {{invoiceNumber}} for your recent payment. Below are the details:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Receipt Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{invoiceNumber}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Project Name:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{projectName}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Receipt Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{invoiceDate}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{dueDate}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Paid:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{amount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Project Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{totalAmount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Paid Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{totalPaidAmount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Remaining Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{remainingAmount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Payment Status:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{{paymentStatus}}</td>
          </tr>
        </table>
        <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>Your Finance Team</p>
      </body>
    </html>
  `);

  const emailContent = emailTemplate({
    customerName: customer.companyName,
    invoiceNumber: invoice.invoiceNumber,
    projectName: project.projectName,
    invoiceDate: invoice.issueDate.toLocaleDateString(),
    dueDate: invoice.dueDate.toLocaleDateString(),
    amount: `${invoice.total.toFixed(2)}`,
    totalAmount: `${payment.totalAmount.toFixed(2)}`,
    totalPaidAmount: `${payment.paidAmount.toFixed(2)}`,
    remainingAmount: `${payment.unpaidAmount.toFixed(2)}`,
    paymentStatus: payment.paymentStatus
  });

  // Save the PDF buffer to a temporary file
  const tempPdfPath = path.join(__dirname, `temp_receipt_${invoice.invoiceNumber}.pdf`);
  await fs.writeFile(tempPdfPath, pdfBuffer);

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: `Receipt ${invoice.invoiceNumber} for ${project.projectName}`,
    html: emailContent,
    attachments: [{
      filename: `receipt_${invoice.invoiceNumber}.pdf`,
      path: tempPdfPath
    }]
  };

  try {
    await transporter.sendMail(mailOptions);
  } finally {
    // Clean up the temporary PDF file
    await fs.unlink(tempPdfPath);
  }
}

async function generateICVCertificate(project, customer) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add logo
  const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/tempproject-4cb9b.appspot.com/o/logo.png?alt=media';
  const logoImageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
  const logoImage = await pdfDoc.embedPng(logoImageBytes);
  page.drawImage(logoImage, {
    x: 50,
    y: page.getHeight() - 100,
    width: 100,
    height: 50,
  });

  // Add certificate title
  page.drawText('ICV Certificate', {
    x: 200,
    y: page.getHeight() - 150,
    size: 28,
    font: helveticaBold,
    color: rgb(0.2, 0.4, 0.6)
  });

  // Add certificate content
  const content = `
This is to certify that

${customer.companyName}

has successfully completed the In-Country Value (ICV) assessment
for the project "${project.projectName}"

Project Type: ${project.projectType}
Completion Date: ${new Date().toLocaleDateString()}

This certificate is issued in recognition of the company's commitment
to enhancing local content and contributing to the national economy.
  `;

  const contentLines = content.split('\n');
  let yPosition = page.getHeight() - 200;

  contentLines.forEach((line, index) => {
    const fontSize = index === 2 ? 16 : 12;
    const font = index === 2 ? helveticaBold : helvetica;
    page.drawText(line.trim(), {
      x: 100,
      y: yPosition,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;
  });

  // Add signature line
  page.drawLine({
    start: { x: 100, y: 150 },
    end: { x: 300, y: 150 },
    thickness: 1,
    color: rgb(0, 0, 0)
  });
  page.drawText('Authorized Signature', {
    x: 150,
    y: 130,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0)
  });

  return await pdfDoc.save();
}

async function sendICVCertificateEmail(fromEmail, toEmail, pdfBuffer, project, customer) {
  const emailTemplate = handlebars.compile(`
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>ICV Certificate for Project: {{projectName}}</h2>
        <p>Dear {{customerName}},</p>
        <p>Congratulations on completing your ICV assessment! Please find attached your ICV certificate for the project "{{projectName}}".</p>
        <p>We appreciate your commitment to enhancing local content and contributing to the national economy.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Your ICV Team</p>
      </body>
    </html>
  `);

  const emailContent = emailTemplate({
    customerName: customer.companyName,
    projectName: project.projectName
  });

  // Save the PDF buffer to a temporary file
  const tempPdfPath = path.join(__dirname, `temp_icv_certificate_${project._id}.pdf`);
  await fs.writeFile(tempPdfPath, pdfBuffer);

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: `ICV Certificate for ${project.projectName}`,
    html: emailContent,
    attachments: [{
      filename: `ICV_Certificate_${project.projectName}.pdf`,
      path: tempPdfPath
    }]
  };

  try {
    await transporter.sendMail(mailOptions);
  } finally {
    // Clean up the temporary PDF file
    await fs.unlink(tempPdfPath);
  }
}

const getProjectsWithPaymentStatus = async (req, res) => {
  try {
    let teamId;

    if (req.role === 'admin' || req.role === 'Operation Manager') {
      const team = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': req.adminId },
          { 'GeneralUser.userId': req.adminId }
        ]
      });

      if (!team) {
        return res.status(404).json({ message: 'Team not found for the user' });
      }

      teamId = team._id;
    } else {
      const user = await GaapUser.findById(req.adminId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      teamId = user.teamId;
    }

    const projects = await GaapProject.find({
      // status: { $in: ['Approved', 'In Progress'] },
      teamId: teamId
    }).populate('customer')
      .populate('assignedTo')
      .populate('salesPerson');

    const projectsWithPayments = await Promise.all(projects.map(async (project) => {
      const payment = await ProjectPayment.findOne({ project: project._id })
        .populate('invoices');

      if (!payment || payment.paymentStatus !== 'Fully Paid') {
        return {
          projectId: project._id,
          projectName: project.projectName,
          customerName: project.customer,
          assignedTo: project.assignedTo,
          salesPerson: project.salesPerson,
          totalAmount: payment ? payment.totalAmount : project.totalAmount,
          paidAmount: payment ? payment.paidAmount : 0,
          unpaidAmount: payment ? payment.unpaidAmount : project.totalAmount,
          paymentStatus: payment ? payment.paymentStatus : 'Not Started',
          lastPaymentDate: payment ? payment.lastPaymentDate : null,
          nextPaymentDue: payment ? payment.nextPaymentDue : null,
          invoices: payment ? payment.invoices.map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            amount: inv.total,
            status: inv.status
          })) : []
        };
      }
      return null;
    }));

    const filteredProjects = projectsWithPayments.filter(Boolean);

    res.status(200).json(filteredProjects);
  } catch (error) {
    console.error('Error fetching projects with payment status:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

module.exports = { getProjectsWithInvoiceStatus, updatePayment, getProjectsWithPaymentStatus }