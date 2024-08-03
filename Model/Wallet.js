const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  TotalSales: {
    type: String,
    default: '0',
  },
  TotalRevenue: {
    type: String,
    default: '0',
  },
  TotalInvoices: {
    type: String,
    default: '0',
  },
  TotalExpenses: {
    type: String,
    default: '0',
  },
  TotalEarnings: {
    type: String,
    default: '0',
  },
  TotalOrders: {
    type: String,
    default: '0',
  },
  TotalCustomers: {
    type: String,
    default: '0',
  },
  PaidInvoices: {
    type: String,
    default: '0',
  },
  UnPaidInvoices: {
    type: String,
    default: '0',
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  period: {
    type: Date,
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
});

walletSchema.virtual('Profit').get(function() {
  return (parseFloat(this.TotalRevenue) - parseFloat(this.TotalExpenses)).toString();
});

walletSchema.set('toJSON', { virtuals: true });
walletSchema.set('toObject', { virtuals: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;



// Expenses - All Expenses value -----      done
// Profit -> Revenue - Expenses -----       done
// Orders - Number of current projects ---  done
// Customers - number of customers     ---  done
// Sales - Number of invoices (Paid)    --done
// Revenue - (amount after deducting VAT%) ---done
// Earnings - Including VAT - matlab total amount  --done
// Paid Invocies / UnPaid invoices (Count)  --done
// all invoices objects