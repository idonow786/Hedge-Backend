const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
 ID: {
  type: Number,
  default: () => Math.floor(Math.random() * 1000000),
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
