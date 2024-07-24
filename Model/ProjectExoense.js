const mongoose = require('mongoose');

// Subcategory Expense Schema
const SubcategoryExpenseSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    min: 0,
  },
  description: {
    type: String,
    trim: true
  }
});

// Project Expense Schema
const ProjectExpenseSchema = new mongoose.Schema({
  projectId: {
    type: String,
  },
  description: {
    type: String,
    trim: true
  },
  adminId: {
    type: String,
  },
  totalAmount: {
    type: Number,
    min: 0
  },

  category: {
    type: String,
  },
  subcategories: [SubcategoryExpenseSchema],
  paidBy: {
    type: String,
  },
  receipt: {
    type: String, 
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  isReimbursed: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit card', 'bank transfer', 'other'],
  },
  vendor: {
    type: String,
    trim: true
  },
  budgetCategory: {
    type: String,
    enum: ['operating', 'capital', 'other'],
  },
  taxDeductible: {
    type: Boolean,
    default: false
  }
});

// Daily Financial Record Schema
const DailyFinancialRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    index: true
  },
  totalRevenue: {
    type: Number,
    min: 0,
    default: 0
  },
  totalExpenses: {
    type: Number,
    min: 0,
    default: 0
  },
  netProfit: {
    type: Number,
    default: 0
  },
  grossProfit: {
    type: Number,
    default: 0
  },
  expenses: [{
    category: String,
    amount: Number,
  }],
  revenue: [{
    source: String,
    amount: Number
  }],
  operatingExpenses: {
    type: Number,
    min: 0,
    default: 0
  },
  taxes: {
    type: Number,
    min: 0,
    default: 0
  },
  projectExpenses: [ProjectExpenseSchema]
}, {
  timestamps: true
});

// Indexes
DailyFinancialRecordSchema.index({ date: -1 });

// Pre-save hooks
DailyFinancialRecordSchema.pre('save', function(next) {
  this.netProfit = this.totalRevenue - this.totalExpenses;
  this.grossProfit = this.totalRevenue - this.operatingExpenses;
  next();
});

// Create model
const DailyFinancialRecord = mongoose.model('DailyFinancialRecord', DailyFinancialRecordSchema);

module.exports = {
  DailyFinancialRecord
};
