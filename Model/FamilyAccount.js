const mongoose = require('mongoose');

const FamilyExpenseItemSchema = new mongoose.Schema({
  expenseType: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const FamilyExpenseSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  expenseId: {
    type: String,
  },

  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  expenses: [FamilyExpenseItemSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

FamilyExpenseSchema.index({ userId: 1, year: 1, month: 1 });

FamilyExpenseSchema.virtual('calculatedTotalAmount').get(function() {
  return this.expenses.reduce((total, expense) => total + expense.amount, 0);
});

FamilyExpenseSchema.pre('save', function(next) {
  this.totalAmount = this.expenses.reduce((total, expense) => total + expense.amount, 0);
  next();
});

const FamilyExpense = mongoose.model('FamilyExpense', FamilyExpenseSchema);

module.exports = FamilyExpense;