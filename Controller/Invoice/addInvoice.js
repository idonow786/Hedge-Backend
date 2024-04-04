const Invoice = require('../../Model/Invoices');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

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
      Quantity,
      Amount,
      Status,
      From,
      To,
      Items,
      SubTotal,
      Vat,
      InvoiceTotal,
      Description,
    } = req.body;
    const adminId = req.user.adminId;

    if (
      !CustomerId ||
      !InvoiceDate ||
      !Quantity ||
      !Amount ||
      !Status ||
      !From ||
      !To ||
      !Items ||
      !SubTotal ||
      !Vat ||
      !InvoiceTotal
    ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate "From" section
    if (!From.Address || !From.Email) {
      return res.status(400).json({ message: 'Please provide all required fields for the "From" section' });
    }

    // Validate "To" section
    if (!To.Address || !To.Email) {
      return res.status(400).json({ message: 'Please provide all required fields for the "To" section' });
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
      From,
      To,
      InvoiceNumber,
      Items,
      SubTotal,
      Vat,
      InvoiceTotal,
      Description,
      AdminID: adminId,
    });

    const savedInvoice = await newInvoice.save();

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
