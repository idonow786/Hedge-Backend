const Invoice = require('../../Model/Invoices');
const Project = require('../../Model/Project');
const Customer = require('../../Model/Customer');
const Wallet = require('../../Model/Wallet');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const adminId = req.adminId;
    const {
      CustomerId,
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
      if (!project) {
        return res.status(404).json({ message: 'Project not found or does not belong to the admin' });
      }
    }

    const previousStatus = invoice.Status;

    invoice.CustomerId = CustomerId || invoice.CustomerId;
    invoice.InvoiceDate = InvoiceDate || invoice.InvoiceDate;
    invoice.Quantity = Quantity !== undefined ? Quantity : invoice.Quantity;
    invoice.Amount = Amount !== undefined ? Amount : invoice.Amount;
    invoice.Status = Status || invoice.Status;
    invoice.InvoiceNumber = InvoiceNumber || invoice.InvoiceNumber;
    invoice.SubTotal = SubTotal !== undefined ? SubTotal : invoice.SubTotal;
    invoice.ProjectId = ProjectId !== undefined ? ProjectId : invoice.ProjectId;
    invoice.Vat = Vat !== undefined ? Vat : invoice.Vat;
    invoice.InvoiceTotal = InvoiceTotal !== undefined ? InvoiceTotal : invoice.InvoiceTotal;
    invoice.Description = Description || invoice.Description;

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

    // Find the wallet for the admin based on the invoice's month
    const invoiceMonth = new Date(updatedInvoice.InvoiceDate).getMonth();
    const invoiceYear = new Date(updatedInvoice.InvoiceDate).getFullYear();
    console.log(invoiceMonth)
    console.log(invoiceYear)
    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: {
        $gte: new Date(invoiceYear, invoiceMonth, 1),
        $lt: new Date(invoiceYear, invoiceMonth + 1, 1),
      },
    });
    console.log(wallet)
    if (wallet) {
      if (previousStatus !== 'paid' && updatedInvoice.Status === 'paid') {
        // If the invoice status changed from unpaid to paid
        wallet.PaidInvoices = (parseInt(wallet.PaidInvoices) + 1).toString();
        wallet.UnPaidInvoices = (parseInt(wallet.UnPaidInvoices) - 1).toString();
        wallet.TotalSales = (parseInt(wallet.TotalSales) + 1).toString();
        wallet.TotalRevenue = (parseFloat(wallet.TotalRevenue) + parseFloat(updatedInvoice.SubTotal)).toString();
        wallet.Earnings = (parseFloat(wallet.Earnings) + parseFloat(updatedInvoice.InvoiceTotal)).toString();
      } else if (previousStatus === 'paid' && updatedInvoice.Status !== 'paid') {
        // If the invoice status changed from paid to unpaid
        wallet.PaidInvoices = (parseInt(wallet.PaidInvoices) - 1).toString();
        wallet.UnPaidInvoices = (parseInt(wallet.UnPaidInvoices) + 1).toString();
        wallet.TotalSales = (parseInt(wallet.TotalSales) - 1).toString();
        wallet.TotalRevenue = (parseFloat(wallet.TotalRevenue) - parseFloat(updatedInvoice.SubTotal)).toString();
        wallet.Earnings = (parseFloat(wallet.Earnings) - parseFloat(updatedInvoice.InvoiceTotal)).toString();
      }
      await wallet.save();
    }

    const customer = await Customer.findById(invoice.CustomerId);

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
            <h2>Invoice Details</h2>
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
                <th>Amount</th>
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
