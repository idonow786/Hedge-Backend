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
    type: String,

  },
  Quantity: {
    type: Number,

  },
  Amount: {
    type: Number,
  },
  ProjectId: {
    type: String,
  },
  Status: {
    type: String,
    enum: ['paid', 'due'],

  },
 
  InvoiceNumber: {
    type: String,
  },
 
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
  customProperties: [{
    propertyName: {
      type: String,
      required: true
    },
    propertyType: {
      type: String,
      enum: ['string', 'number', 'boolean'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    }
  }]
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
