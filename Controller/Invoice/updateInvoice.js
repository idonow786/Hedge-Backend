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

const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const adminId = req.adminId;
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

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, AdminID: adminId });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or not authorized' });
    }

    if (ProjectId) {
      const project = await Project.findOne({ _id: ProjectId, AdminID: adminId });
      const projectC = await ProjectC.findOne({ clientId: CustomerId, adminId: adminId, _id: ProjectId });
      if (!project && !projectC) {
        return res.status(404).json({ message: 'Project not found or does not belong to the admin' });
      }
    }

    if (CustomerId) {
      const customer = await Customer.findOne({ _id: CustomerId, AdminID: adminId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found or does not belong to the admin' });
      }
    }

    const previousStatus = invoice.Status;

    // Update all fields that are provided in the request
    if (CustomerId) invoice.CustomerId = CustomerId;
    if (InvoiceDate) invoice.InvoiceDate = InvoiceDate;
    if (ProjectId) invoice.ProjectId = ProjectId;
    if (Quantity !== undefined) invoice.Quantity = Quantity;
    if (Amount !== undefined) invoice.Amount = Amount;
    if (Status) invoice.Status = Status;
    if (SubTotal !== undefined) invoice.SubTotal = SubTotal;
    if (Vat !== undefined) invoice.Vat = Vat;
    if (InvoiceTotal !== undefined) invoice.InvoiceTotal = InvoiceTotal;
    if (Description) invoice.Description = Description;

    // Handle file upload if a new image is provided
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const contentType = req.file.mimetype;

      try {
        const PicUrl = await uploadImageToFirebase(base64Image, contentType);
        invoice.PicUrl = PicUrl;
      } catch (error) {
        console.error('Error uploading picture:', error);
        return res.status(500).json({ message: 'Failed to upload picture' });
      }
    }

    const updatedInvoice = await invoice.save();

    // Update wallet
    const invoiceMonth = new Date(updatedInvoice.InvoiceDate).getMonth();
    const invoiceYear = new Date(updatedInvoice.InvoiceDate).getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: new Date(invoiceYear, invoiceMonth, 1),
    });

    if (!wallet) {
      wallet = new Wallet({
        AdminID: adminId,
        period: new Date(invoiceYear, invoiceMonth, 1),
        UnPaidInvoices: '0',
        PaidInvoices: '0',
        TotalInvoices: '0',
        TotalSales: '0',
        TotalRevenue: '0',
        TotalEarnings: '0',
      });
    }

    if (previousStatus !== 'paid' && updatedInvoice.Status === 'paid') {
      wallet.PaidInvoices = (parseInt(wallet.PaidInvoices) + 1).toString();
      wallet.UnPaidInvoices = (parseInt(wallet.UnPaidInvoices) - 1).toString();
      wallet.TotalSales = (parseInt(wallet.TotalSales) + 1).toString();
      wallet.TotalRevenue = (parseFloat(wallet.TotalRevenue) + parseFloat(updatedInvoice.SubTotal)).toString();
      wallet.TotalEarnings = (parseFloat(wallet.TotalEarnings) + parseFloat(updatedInvoice.InvoiceTotal)).toString();
    } else if (previousStatus === 'paid' && updatedInvoice.Status !== 'paid') {
      wallet.PaidInvoices = (parseInt(wallet.PaidInvoices) - 1).toString();
      wallet.UnPaidInvoices = (parseInt(wallet.UnPaidInvoices) + 1).toString();
      wallet.TotalSales = (parseInt(wallet.TotalSales) - 1).toString();
      wallet.TotalRevenue = (parseFloat(wallet.TotalRevenue) - parseFloat(updatedInvoice.SubTotal)).toString();
      wallet.TotalEarnings = (parseFloat(wallet.TotalEarnings) - parseFloat(updatedInvoice.InvoiceTotal)).toString();
    }

    await wallet.save();

    // Send email notification
    const customer = await Customer.findById(updatedInvoice.CustomerId);

    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = 'Updated Invoice Details';
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
        <h2>Updated Invoice Details</h2>
        <table>
          <tr>
            <th>Invoice Number</th>
            <td>${updatedInvoice.InvoiceNumber}</td>
          </tr>
          <tr>
            <th>Order Number</th>
            <td>${updatedInvoice.OrderNumber}</td>
          </tr>
          <tr>
            <th>Invoice Date</th>
            <td>${updatedInvoice.InvoiceDate}</td>
          </tr>
          <tr>
            <th>Quantity</th>
            <td>${updatedInvoice.Quantity}</td>
          </tr>
          <tr>
            <th>Amountth>
            <td>${updatedInvoice.Amount}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>${updatedInvoice.Status}</td>
          </tr>
          <tr>
            <th>Subtotal</th>
            <td>${updatedInvoice.SubTotal}</td>
          </tr>
          <tr>
            <th>VAT</th>
            <td>${updatedInvoice.Vat}</td>
          </tr>
          <tr class="total">
            <th>Total</th>
            <td>${updatedInvoice.InvoiceTotal}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>${updatedInvoice.Description}</td>
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

    res.status(200).json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateInvoice };
