const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapreportSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  reportType: {
    type: String,
    enum: ['Daily', 'Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const GaapReport = mongoose.model('GaapReport', gaapreportSchema);

module.exports = GaapReport;
