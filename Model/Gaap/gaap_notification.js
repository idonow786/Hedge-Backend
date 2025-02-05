const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapnotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
  },
  message: {
    type: String,
  },
  department: {
    type: String,
  },
  //hh
  teamId: {
    type: String
  },
  branchId: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Project', 'Task', 'Payment', 'Other'],
    default: 'Other'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject'
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread'
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

const GaapNotification = mongoose.model('GaapNotification', gaapnotificationSchema);

module.exports = GaapNotification;
