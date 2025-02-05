const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapBranchSchema = new Schema({
  branchName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  }],
  isActive: {
    type: Boolean,
    default: true
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

const GaapBranch = mongoose.model('GaapBranch', gaapBranchSchema);

module.exports = GaapBranch; 