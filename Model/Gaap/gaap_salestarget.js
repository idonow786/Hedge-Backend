const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapSalesTargetSchema = new Schema({
  targetType: {
    type: String,
    enum: ['Daily', 'Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  targetPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  teamId: {
    type: String,
  },
  branchId: {
    type: String,
  },
  targetDetails: {
    officeVisits: { type: Number },
    closings: { type: Number }
  },
  // assignedTo: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'GaapUser'
  // }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  achievedValue: {
    officeVisits: { type: Number, default: 0 },
    closings: { type: Number, default: 0 }
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

const GaapSalesTarget = mongoose.model('GaapSalesTarget', gaapSalesTargetSchema);

module.exports = GaapSalesTarget;
