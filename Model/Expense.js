const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
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
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
