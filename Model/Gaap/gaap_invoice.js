const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapinvoiceItemSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  }
});

const gaapinvoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'GaapCustomer',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [gaapinvoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxTotal: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  paymentTerms: {
    type: String
  },
  notes: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  },
  approvalDate: {
    type: Date
  },
  currency: {
    type: String,
    required: true,
    default: 'AED'  
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  attachments: [{
    name: String,
    url: String,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'GaapUser'
    },
    uploadDate: Date
  }],
  reminders: [{
    sentDate: Date,
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'GaapUser'
    },
    method: {
      type: String,
      enum: ['Email', 'SMS', 'Phone']
    },
    notes: String
  }],
  payments: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapPayment'
  }]
}, {
  timestamps: true
});

// Virtual for amount due
gaapinvoiceSchema.virtual('amountDue').get(function() {
  return this.total - this.payments.reduce((sum, payment) => sum + payment.amount, 0);
});

// Virtual for payment status
gaapinvoiceSchema.virtual('paymentStatus').get(function() {
  if (this.amountDue === 0) return 'Fully Paid';
  if (this.amountDue < this.total) return 'Partially Paid';
  return 'Unpaid';
});

gaapinvoiceSchema.methods.send = async function() {
  this.status = 'Sent';
  await this.save();
};

// Static method to find overdue invoices
gaapinvoiceSchema.statics.findOverdue = function() {
  return this.find({
    status: { $nin: ['Paid', 'Cancelled'] },
    dueDate: { $lt: new Date() }
  });
};

// Middleware to update project when invoice is created
gaapinvoiceSchema.post('save', async function(doc) {
  const Project = mongoose.model('GaapProject');
  await Project.findByIdAndUpdate(doc.project, {
    $push: { invoices: doc._id }
  });
});

const GaapInvoice = mongoose.model('GaapInvoice', gaapinvoiceSchema);

module.exports = GaapInvoice;
