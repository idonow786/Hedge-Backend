const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapCustomer = require('../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const handlebars = require('handlebars');
const { PDFDocument } = require('pdf-lib');
const dotenv = require('dotenv');
const htmlPdf = require('html-pdf-node');

dotenv.config();
function numberToWords(number) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convertLessThanOneThousand(n) {
    if (n === 0) return '';

    let result = '';

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result.trim();
    }

    if (n > 0) {
      result += ones[n] + ' ';
    }

    return result.trim();
  }

  function convertToWords(n) {
    if (n === 0) return 'Zero';

    const billion = Math.floor(n / 1000000000);
    const million = Math.floor((n % 1000000000) / 1000000);
    const thousand = Math.floor((n % 1000000) / 1000);
    const remainder = n % 1000;

    let result = '';

    if (billion) result += convertLessThanOneThousand(billion) + ' Billion ';
    if (million) result += convertLessThanOneThousand(million) + ' Million ';
    if (thousand) result += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (remainder) result += convertLessThanOneThousand(remainder);

    return result.trim();
  }

  // Split the number into dirhams and fils
  const parts = number.toFixed(2).split('.');
  const dirhams = parseInt(parts[0]);
  const fils = parseInt(parts[1]);

  let result = '';

  if (dirhams > 0) {
    result += convertToWords(dirhams) + ' Dirham' + (dirhams !== 1 ? 's' : '');
  }

  if (fils > 0) {
    if (result !== '') result += ' and ';
    result += convertToWords(fils) + ' Fil' + (fils !== 1 ? 's' : '');
  }

  return result + ' Only';
}
const generateAndSendProposal = async (req, res) => {
  try {
    console.log('Starting proposal generation process...');
    const { projectId } = req.body;
    const adminId = req.adminId;

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

    // Find sender (admin user)
    console.log('Finding sender...');
    const sender = await GaapUser.findById(adminId);
    if (!sender) {
      console.log('Sender not found');
      return res.status(404).json({ message: 'Sender not found' });
    }

    // Read template files
    console.log('Reading template files...');
    const template1 = await fs.readFile(path.join(__dirname, '../Template/page1.html'), 'utf8');
    const template2 = await fs.readFile(path.join(__dirname, '../Template/page2.html'), 'utf8');

    // Compile templates
    console.log('Compiling templates...');
    const compiledTemplate1 = handlebars.compile(template1);
    const compiledTemplate2 = handlebars.compile(template2);
    const discountedAmount = project.totalAmount - project.appliedDiscount;
    // Prepare data for templates
    console.log('Preparing data for templates...');
    const data = {
      projectName: project.projectName,
      description: project.description,
      customerName: customer.companyName,
      contactPerson: customer.contactPerson1.name,
      projectType: project.projectType,
      startDate: project.startDate.toLocaleDateString(),
      endDate: project.endDate ? project.endDate.toLocaleDateString() : 'TBD',
      referenceNumber: `GAAP/MR/${project._id.toString().slice(-2)}`,
      currentDate: new Date().toLocaleDateString(),
      customerAddress: `${customer.address.street}, ${customer.address.city}, ${customer.address.country}`,
      quoteNumber: `QUOTE-${project._id.toString().slice(-4)}`,
      validUntil: new Date(project.startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      itemName: project.projectType,
      rate: discountedAmount.toFixed(2),
      quantity: 1,
      amount: discountedAmount.toFixed(2),
      taxableAmount: discountedAmount.toFixed(2),
      vat: 0,
      totalAmount: (discountedAmount).toFixed(2),
      amountInWords: numberToWords(Math.floor(discountedAmount))
    };

    // Generate HTML content
    console.log('Generating HTML content...');
    const html1 = compiledTemplate1(data);
    const html2 = compiledTemplate2(data);

    // Generate PDFs
    console.log('Generating PDFs...');
    const options = {
      format: 'A4',
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      printBackground: true
    };

    try {
      const pdf1 = await htmlPdf.generatePdf({ content: html1 }, options);
      console.log('First page PDF generated');

      const pdf2 = await htmlPdf.generatePdf({ content: html2 }, options);
      console.log('Second page PDF generated');

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
        from: sender.email,
        to: customer.contactPerson1.email,
        subject: 'Business Proposal from GAAP',
        text: `Dear Sir,

Greetings from GAAP

Hope this message finds you well.

Attached, please find the proposal for services you requested.

To proceed, we kindly request your review and approval of the proposal. If you have any questions or need further adjustments, please do not hesitate to let us know. 

We are happy to discuss any aspects of the proposal to ensure it meets your needs and expectations.

Please confirm your approval, so we can move forward with the next steps.

Kindly note that this proposal is valid for 15 days from the date of issue.

Thank you for your attention to this matter. We look forward to your feedback and to working together on this project.

Best regards,
${sender.fullName}
${sender.role}
GAAP`,
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
      console.error('Error in PDF generation or email sending:', error);
      throw error; // Re-throw to be caught by the main try-catch block
    }
  } catch (error) {
    console.error('Error in generateAndSendProposal:', error);
    res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
  }
};


module.exports = { generateAndSendProposal };