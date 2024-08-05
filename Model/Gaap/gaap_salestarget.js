const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapsalesTargetSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
    required: true
  },
  targetType: {
    type: String,
    enum: ['Daily', 'Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  achievedValue: {
    type: Number,
    default: 0
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

const GaapSalesTarget = mongoose.model('GaapSalesTarget', gaapsalesTargetSchema);

module.exports = GaapSalesTarget;
