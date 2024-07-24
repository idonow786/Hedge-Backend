const mongoose = require('mongoose');

const FamilyExpenseItemSchema = new mongoose.Schema({
  expenseType: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  }
});

const FamilyExpenseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  expenses: [FamilyExpenseItemSchema],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
FamilyExpenseSchema.index({ userId: 1, 'expenses.date': 1 });

// Virtual for calculating total amount
FamilyExpenseSchema.virtual('totalAmount').get(function() {
  return this.expenses.reduce((total, expense) => total + expense.amount, 0);
});

// Virtual for getting daily expenses
FamilyExpenseSchema.virtual('dailyExpenses').get(function() {
  const dailyExpenses = {};
  this.expenses.forEach(expense => {
    const dateString = expense.date.toISOString().split('T')[0];
    if (!dailyExpenses[dateString]) {
      dailyExpenses[dateString] = { date: expense.date, expenses: [], totalAmount: 0 };
    }
    dailyExpenses[dateString].expenses.push(expense);
    dailyExpenses[dateString].totalAmount += expense.amount;
  });
  return Object.values(dailyExpenses);
});

const FamilyExpense = mongoose.model('FamilyExpense', FamilyExpenseSchema);

module.exports = FamilyExpense;
