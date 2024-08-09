const mongoose = require('mongoose');

const dailyPerformanceReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  cashInflow: {
    type: Number,
    required: true,
    min: 0
  },
  cashOutflow: {
    type: Number,
    required: true,
    min: 0
  },
  invoicesCreated: {
    type: Number,
    required: true,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GaapUser'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyPerformanceReport', dailyPerformanceReportSchema);
