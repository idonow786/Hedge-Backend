const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapCustomer = require('../../../Model/Gaap/gaap_customer');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const handlebars = require('handlebars');
const { PDFDocument } = require('pdf-lib');
const dotenv = require('dotenv');

dotenv.config();

const generateAndSendProposal = async (req, res) => {
  try {
    console.log('Starting proposal generation process...');
    const { projectId } = req.body;

    // Find project
    console.log('Finding project...');
    const project = await GaapProject.findById(projectId).populate('customer');
    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find customer
    console.log('Finding customer...');
    const customer = await GaapCustomer.findById(project.customer);
    if (!customer) {
      console.log('Customer not found');
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Read template files
    console.log('Reading template files...');
    const template1 = await fs.readFile(path.join(__dirname, '../Template/page1.html'), 'utf8');
    const template2 = await fs.readFile(path.join(__dirname, '../Template/page2.html'), 'utf8');

    // Compile templates
    console.log('Compiling templates...');
    const compiledTemplate1 = handlebars.compile(template1);
    const compiledTemplate2 = handlebars.compile(template2);

    // Prepare data for templates
    console.log('Preparing data for templates...');
    const data = {
      projectName: project.projectName,
      customerName: customer.companyName,
      contactPerson: customer.contactPerson1.name,
      projectType: project.projectType,
      startDate: project.startDate.toLocaleDateString(),
      endDate: project.endDate ? project.endDate.toLocaleDateString() : 'TBD',
      referenceNumber: `GAAP/MR/${project._id.toString().slice(-2)}`,
      currentDate: new Date().toLocaleDateString(),
      customerAddress: `${customer.address.street}, ${customer.address.city}, ${customer.address.country}`,
      quoteNumber: `QUOTE-${project._id.toString().slice(-4)}`,
      validUntil: new Date(project.startDate.getTime() + 30*24*60*60*1000).toLocaleDateString(),
      itemName: project.projectType,
      rate: project.totalAmount.toFixed(2),
      quantity: 1,
      amount: project.totalAmount.toFixed(2),
      taxableAmount: project.totalAmount.toFixed(2),
      vat: (project.totalAmount * 0.05).toFixed(2),
      totalAmount: (project.totalAmount * 1.05).toFixed(2),
      amountInWords: numberToWords(project.totalAmount * 1.05) + " AED only"
    };

    // Generate HTML content
    console.log('Generating HTML content...');
    const html1 = compiledTemplate1(data);
    const html2 = compiledTemplate2(data);

    // Generate PDF
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new'  // Use new headless mode
    });
    console.log('Browser launched successfully');

    const page = await browser.newPage();
    console.log('New page created');

    const pdfOptions = {
      format: 'A4',
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      printBackground: true
    };

    // First page
    console.log('Generating first page PDF...');
    await page.setContent(html1, { waitUntil: 'networkidle0' });
    const pdf1 = await page.pdf(pdfOptions);
    console.log('First page PDF generated');

    // Second page
    console.log('Generating second page PDF...');
    await page.setContent(html2, { waitUntil: 'networkidle0' });
    const pdf2 = await page.pdf(pdfOptions);
    console.log('Second page PDF generated');

    await browser.close();
    console.log('Browser closed');

    // Merge PDFs using pdf-lib
    console.log('Merging PDFs...');
    const mergedPdf = await PDFDocument.create();
    const pdf1Doc = await PDFDocument.load(pdf1);
    const pdf2Doc = await PDFDocument.load(pdf2);

    const copiedPages1 = await mergedPdf.copyPages(pdf1Doc, pdf1Doc.getPageIndices());
    copiedPages1.forEach((page) => mergedPdf.addPage(page));

    const copiedPages2 = await mergedPdf.copyPages(pdf2Doc, pdf2Doc.getPageIndices());
    copiedPages2.forEach((page) => mergedPdf.addPage(page));

    const pdfBytes = await mergedPdf.save();

    // Write the merged PDF to a file
    console.log('Writing merged PDF to file...');
    const pdfPath = path.join(__dirname, 'final_proposal.pdf');
    await fs.writeFile(pdfPath, pdfBytes);

    // Send email using SendinBlue
    console.log('Sending email...');
    const transporter = nodemailer.createTransport(
      new sendinBlue({
        apiKey: process.env.SENDINBLUE_API_KEY,
      })
    );

    const mailOptions = {
      from: process.env.Email_Sender,
      // to: customer.contactPerson1.email,
      to: 'hashmiosama555@gmail.com',
      subject: 'Business Proposal',
      text: 'Please find attached our business proposal.',
      attachments: [{
        filename: 'business_proposal.pdf',
        path: pdfPath
      }]
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    // Clean up final PDF
    console.log('Cleaning up temporary PDF file...');
    await fs.unlink(pdfPath);

    console.log('Proposal generation process completed successfully');
    res.status(200).json({ message: 'Proposal generated and sent successfully' });
  } catch (error) {
    console.error('Error in generateAndSendProposal:', error);
    res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
  }
};

// Helper function to convert numbers to words (you may want to use a library for this)
function numberToWords(num) {
  // Implement number to words conversion
  // This is a placeholder implementation
  return num.toFixed(2).toString();
}

module.exports = { generateAndSendProposal };