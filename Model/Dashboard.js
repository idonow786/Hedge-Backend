const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  Date: {
    type: Date,
  },
  Sales: {
    type: Number,
    default: 0,
  },
  Revenue: {
    type: Number,
    default: 0,
  },
  Conversion: {
    type: Number,
    default: 0,
  },
  Leads: {
    type: Number,
    default: 0,
  },
  NewCustomers: {
    type: Number,
    default: 0,
  },
  TotalInvoices: {
    type: Number,
    default: 0,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  RevenueReport: [
    {
      Month: {
        type: String,
      },
      NetProfit: {
        type: Number,
      },
      Revenue: {
        type: Number,
      },
      FreeCashFlow: {
        type: Number,
      },
    },
  ],
  Statistics: {
    Orders: {
      type: Number,
      default: 0,
    },
    Profit: {
      type: Number,
      default: 0,
    },
    Earnings: {
      type: Number,
      default: 0,
    },
    SuccessRate: {
      type: Number,
      default: 0,
    },
    ReturnRate: {
      type: Number,
      default: 0,
    },
  },
});

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;