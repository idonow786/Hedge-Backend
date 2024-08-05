const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaappaymentSchema = new Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'GaapCustomer',
    required: true
  },
  invoice: {
    type: Schema.Types.ObjectId,
    ref: 'GaapInvoice',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment'],
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'AED'
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  transactionId: String,
  chequeNumber: String,
  bankName: String,
  accountNumber: String,
  notes: String,
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  },
  approvalDate: Date,
  attachments: [{
    name: String,
    url: String
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  }
}, {
  timestamps: true
});

const GaapPayment = mongoose.model('GaapPayment', gaappaymentSchema);

module.exports = GaapPayment;
