const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  Date: {
    type: Date,
    required: true,
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
  RevenueReport: [
    {
      Month: {
        type: String,
        required: true,
      },
      NetProfit: {
        type: Number,
        required: true,
      },
      Revenue: {
        type: Number,
        required: true,
      },
      FreeCashFlow: {
        type: Number,
        required: true,
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