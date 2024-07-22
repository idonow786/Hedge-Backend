const mongoose = require('mongoose');

const monthlyBalanceSchema = new mongoose.Schema({
  month: { type: Number },
  balance: { type: Number, default: 0 }
});

const yearlyBalanceSchema = new mongoose.Schema({
  year: { type: Number},
  monthlyBalances: [monthlyBalanceSchema]
});

const projectExpenseSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', },
  amount: { type: Number,  }
});

const customerWalletSchema = new mongoose.Schema({
    adminId:{
        type:String,
    },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  expensePerProject: [projectExpenseSchema],
  totalBalance: {
    type: Number,
    default: 0
  },
  yearlyBalances: [yearlyBalanceSchema],
  totalProjectsDone: {
    type: Number,
    default: 0
  },
  totalProjectsDoing: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

customerWalletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CustomerWallet = mongoose.model('CustomerWallet', customerWalletSchema);

module.exports = CustomerWallet;
