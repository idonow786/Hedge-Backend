const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  OrderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  CustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  PicUrl: {
    type: String,
  },
  InvoiceDate: {
    type: Date,
    required: true,
  },
  Quantity: {
    type: Number,
    required: true,
  },
  Amount: {
    type: Number,
    required: true,
  },
  Status: {
    type: String,
    enum: ['paid', 'due'],
    required: true,
  },
  From: {
    Address: {
      type: String,
      required: true,
    },
    PhoneNo: [{
      type: String,
    }],
    Email: {
      type: String,
      required: true,
    },
  },
  To: {
    Address: {
      type: String,
      required: true,
    },
    PhoneNo: [{
      type: String,
    }],
    Email: {
      type: String,
      required: true,
    },
  },
  InvoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  Items: [{
    ItemTitle: {
      type: String,
      required: true,
    },
    Quantity: {
      type: Number,
      required: true,
    },
    Price: {
      type: Number,
      required: true,
    },
    Total: {
      type: Number,
      required: true,
    },
  }],
  SubTotal: {
    type: Number,
    required: true,
  },
  Vat: {
    type: Number,
    required: true,
  },
  InvoiceTotal: {
    type: Number,
    required: true,
  },
  Description: {
    type: String,
  },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
