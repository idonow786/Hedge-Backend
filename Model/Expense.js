const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  ID: {
    type: Number,
  },
  ExpenseTitle: {
    type: String,
  },
  Amount: {
    type: Number,
  },
  Date: {
    type: Date,
  },
  Description: {
    type: String,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
