const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
 ID: {
  type: Number,
  default: () => Math.floor(Math.random() * 1000000),
},

  OrderNumber: {
    type: String,
  },
  CustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',

  },
  PicUrl: {
    type: String,
  },
  InvoiceDate: {
    type: Date,

  },
  Quantity: {
    type: Number,

  },
  Amount: {
    type: Number,

  },
  Status: {
    type: String,
    enum: ['paid', 'due'],

  },
  From: {
    Address: {
      type: String,

    },
    PhoneNo: [{
      type: String,
    }],
    Email: {
      type: String,

    },
  },
  To: {
    Address: {
      type: String,

    },
    PhoneNo: [{
      type: String,
    }],
    Email: {
      type: String,

    },
  },
  InvoiceNumber: {
    type: String,
  },
  Items: [{
    ItemTitle: {
      type: String,

    },
    Quantity: {
      type: Number,

    },
    Price: {
      type: Number,

    },
    Total: {
      type: Number,

    },
  }],
  SubTotal: {
    type: Number,

  },
  Vat: {
    type: Number,

  },
  InvoiceTotal: {
    type: Number,

  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  Description: {
    type: String,
  },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
