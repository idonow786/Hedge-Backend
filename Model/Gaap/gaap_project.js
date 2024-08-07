const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapprojectSchema = new Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'GaapCustomer',
    required: true
  },
  projectType: {
    type: String,
    enum: ['External Audit', 'ICV', 'ICV+external Audit', 'Audit & Assurance', 'Book keeping', 'Registration & Filing', 'Taxation', 'Compliance', 'Other'],
    required: true
  },
  department: {
    type: String,
    enum: ['Audit', 'Accounts Manager', 'VAT Filing', 'Compliance Manager', 'Other'],
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  salesPerson: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['Proposed', 'Approved', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Proposed'
  },
  pricingType: {
    type: String,
    enum: ['Fixed', 'Variable'],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  appliedDiscount: {
    type: Number,
    default: 0
  },
  discountApprovedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  },
  products: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'GaapProduct'
    },
    quantity: Number,
    price: Number,
    turnoverRange: String,
    timeDeadline: Number
  }],
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapTask'
  }],
  documents: [{
    name: String,
    url: String,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'GaapUser'
    },
    uploadDate: Date
  }],
  notes: String,
  approvals: [{
    stage: String,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'GaapUser'
    },
    approvedDate: Date,
    comments: String
  }],
  invoices: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapInvoice'
  }],
  payments: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapPayment'
  }],
  vatDetails: {
    vatNumber: String,
    vatCertificate: String,
    ftaUsername: String,
    ftaPassword: String,
    vatPaymentBatch: String
  },
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

// Virtual for project progress
gaapprojectSchema.virtual('progress').get(function() {
  if (this.tasks.length === 0) return 0;
  const completedTasks = this.tasks.filter(task => task.status === 'Completed').length;
  return (completedTasks / this.tasks.length) * 100;
});

// Method to get total invoiced amount
gaapprojectSchema.methods.getTotalInvoicedAmount = async function() {
  await this.populate('invoices');
  return this.invoices.reduce((total, invoice) => total + invoice.amount, 0);
};

// Method to get total paid amount
gaapprojectSchema.methods.getTotalPaidAmount = async function() {
  await this.populate('payments');
  return this.payments.reduce((total, payment) => total + payment.amount, 0);
};

// Static method to find projects by department
gaapprojectSchema.statics.findByDepartment = function(department) {
  return this.find({ department: department });
};

// Middleware to update lastUpdatedBy before save
gaapprojectSchema.pre('save', function(next) {
  this.lastUpdatedBy = this.modifiedBy;
  next();
});

const GaapProject = mongoose.model('GaapProject', gaapprojectSchema);

module.exports = GaapProject;
