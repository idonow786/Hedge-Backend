const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectPaymentSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
    required: true
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
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  unpaidAmount: {
    type: Number,
    default: function() {
      return this.totalAmount - this.paidAmount;
    }
  },
  paymentSchedule: [{
    dueDate: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue'],
      default: 'Pending'
    }
  }],
  paymentHistory: [{
    amount: Number,
    date: Date,
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Check', 'Credit Card', 'Other']
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'GaapUser'
    },
    notes: String
  }],
  lastPaymentDate: Date,
  nextPaymentDue: Date,
  paymentStatus: {
    type: String,
    enum: ['Not Started', 'Partially Paid', 'Fully Paid', 'Overdue'],
    default: 'Not Started'
  },
  invoices: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapInvoice'
  }],
  currency: {
    type: String,
    default: 'AED'  
  },
  notes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  }
}, {
  timestamps: true
});

// Virtual for payment progress percentage
projectPaymentSchema.virtual('paymentProgress').get(function() {
  return (this.paidAmount / this.totalAmount) * 100;
});

// Method to add a new payment
projectPaymentSchema.methods.addPayment = function(amount, date, paymentMethod, receivedBy, notes) {
  this.paymentHistory.push({
    amount,
    date,
    paymentMethod,
    receivedBy,
    notes
  });
  this.paidAmount += amount;
  this.unpaidAmount = this.totalAmount - this.paidAmount;
  this.lastPaymentDate = date;
  this.updatePaymentStatus();
};

projectPaymentSchema.methods.updatePaymentStatus = function() {
  if (this.paidAmount === 0) {
    this.paymentStatus = 'Not Started';
  } else if (this.paidAmount < this.totalAmount) {
    this.paymentStatus = 'Partially Paid';
  } else if (this.paidAmount === this.totalAmount) {
    this.paymentStatus = 'Fully Paid';
  }

  const today = new Date();
  const overduePayments = this.paymentSchedule.filter(payment => 
    payment.status === 'Pending' && payment.dueDate < today
  );
  if (overduePayments.length > 0) {
    this.paymentStatus = 'Overdue';
  }

  const nextPayment = this.paymentSchedule.find(payment => payment.status === 'Pending');
  this.nextPaymentDue = nextPayment ? nextPayment.dueDate : null;
};

projectPaymentSchema.pre('save', function(next) {
  this.lastUpdatedBy = this.modifiedBy;
  this.updatePaymentStatus();
  next();
});

const ProjectPayment = mongoose.model('ProjectPayment', projectPaymentSchema);

module.exports = ProjectPayment;
