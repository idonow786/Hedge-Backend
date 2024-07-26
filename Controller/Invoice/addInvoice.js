const Invoice = require('../../Model/Invoices');
const Project = require('../../Model/Project');
const ProjectC = require('../../Model/projectConstruction');
const Customer = require('../../Model/Customer');
const Wallet = require('../../Model/Wallet');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const SibApiV3Sdk = require('sib-api-v3-sdk');

function generateOrderNumber() {
  return Math.floor(Math.random() * 1000000);
}

function generateInvoiceNumber() {
  const randomNumbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const randomCharacters = Math.random().toString(36).substring(2, 4).toUpperCase();
  return randomNumbers + randomCharacters;
}

const createInvoice = async (req, res) => {
  try {
    const {
      CustomerId,
      InvoiceDate,
      ProjectId,
      Quantity,
      Amount,
      Status,
      SubTotal,
      Vat,
      InvoiceTotal,
      Description,
    } = req.body;
    const adminId = req.adminId;

    if (
      !CustomerId ||
      !InvoiceDate ||
      !Quantity ||
      !Amount ||
      !Status ||
      !SubTotal ||
      !Vat ||
      !InvoiceTotal ||
      !ProjectId
    ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const project = await Project.findOne({ _id: ProjectId, AdminID: adminId });
    const projectC = await ProjectC.findOne({ clientId: CustomerId, adminId: adminId,_id: ProjectId});
    if (!projectC && !project) {
      return res.status(404).json({ message: 'Project not found or does not belong to the admin' });
    }

    const customer = await Customer.findOne({ _id: CustomerId, AdminID: adminId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found or does not belong to the admin' });
    }

    const ID = Math.floor(Math.random() * 1000000);
    const OrderNumber = generateOrderNumber();
    const InvoiceNumber = generateInvoiceNumber();

    let PicUrl = null;
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const contentType = req.file.mimetype;

      try {
        PicUrl = await uploadImageToFirebase(base64Image, contentType);
      } catch (error) {
        console.error('Error uploading picture:', error);
        return res.status(500).json({ message: 'Failed to upload picture' });
      }
    }

    const newInvoice = new Invoice({
      ID,
      OrderNumber,
      CustomerId,
      PicUrl,
      InvoiceDate,
      Quantity,
      Amount,
      Status,
      InvoiceNumber,
      SubTotal,
      Vat,
      ProjectId,
      InvoiceTotal,
      Description,
      AdminID: adminId,
    });

    const savedInvoice = await newInvoice.save();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
    });

    if (wallet) {
      wallet.UnPaidInvoices = (parseInt(wallet.UnPaidInvoices) + 1).toString();
      wallet.TotalInvoices = (parseInt(wallet.TotalInvoices) + 1).toString();
    } else {
      wallet = new Wallet({
        UnPaidInvoices: '1',
        TotalInvoices: '1',
        AdminID: adminId,
        period: new Date(currentYear, currentMonth, 1),
      });
    }

    await wallet.save();

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = 'Invoice Details';
    sendSmtpEmail.htmlContent = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 5px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        h2 {
          color: #333333;
          margin-top: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #dddddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .total {
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #888888;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Invoice Details</h2>
        <table>
          <tr>
            <th>Invoice Number</th>
            <td>${savedInvoice.InvoiceNumber}</td>
          </tr>
          <tr>
            <th>Order Number</th>
            <td>${savedInvoice.OrderNumber}</td>
          </tr>
          <tr>
            <th>Invoice Date</th>
            <td>${savedInvoice.InvoiceDate}</td>
          </tr>
          <tr>
            <th>Quantity</th>
            <td>${savedInvoice.Quantity}</td>
          </tr>
          <tr>
            <th>Amount</th>
            <td>${savedInvoice.Amount}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>${savedInvoice.Status}</td>
          </tr>
          <tr>
            <th>Subtotal</th>
            <td>${savedInvoice.SubTotal}</td>
          </tr>
          <tr>
            <th>VAT</th>
            <td>${savedInvoice.Vat}</td>
          </tr>
          <tr class="total">
            <th>Total</th>
            <td>${savedInvoice.InvoiceTotal}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>${savedInvoice.Description}</td>
          </tr>
        </table>
        <div class="footer">
          Thank you for your business!
        </div>
      </div>
    </body>
    </html>
    
    `;
    sendSmtpEmail.sender = {
      name: 'CRM',
      email: 'noreply@crm.com',
    };

    sendSmtpEmail.to = [
      {
        email: customer.Email,
        name: customer.Name,
      },
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: savedInvoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Invoice with the same order number or invoice number already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createInvoice };
















