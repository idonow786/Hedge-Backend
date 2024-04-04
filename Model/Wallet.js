const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  TotalSales: {
    type: Number,
    default: 0,
  },
  TotalRevenue: {
    type: Number,
    default: 0,
  },
  TotalInvoices: {
    type: Number,
    default: 0,
  },
  TotalExpenses: {
    type: Number,
    default: 0,
  },
  Profit: {
    type: Number,
    default: 0,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;