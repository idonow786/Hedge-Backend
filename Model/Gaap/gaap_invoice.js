const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapInvoiceItemSchema = new Schema({
  description: {
    type: String,
  },
  quantity: {
    type: Number,

  },
  unitPrice: {
    type: Number,

  },

  amount: {
    type: Number,

  },
  taxRate: {
    type: Number,
    default: 0,

  },
  taxAmount: {
    type: Number,
    default: 0,
  }
});

const gaapInvoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'GaapCustomer',
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  teamId: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  items: [gaapInvoiceItemSchema],
  subtotal: {
    type: Number,
  },
  taxTotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
  },
  status: {
    type: String,
    default:'sent'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
  },
  currency: {
    type: String,
    default: 'AED'  
  }
}, {
  timestamps: true
});


const GaapInvoice = mongoose.model('GaapInvoice', gaapInvoiceSchema);

module.exports = GaapInvoice;
