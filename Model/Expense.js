const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  ExpenseTitle: {
    type: String,
    required: true,
  },
  Amount: {
    type: Number,
    required: true,
  },
  Date: {
    type: Date,
    required: true,
  },
  Description: {
    type: String,
  },
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
