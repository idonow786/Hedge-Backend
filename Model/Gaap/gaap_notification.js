const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapnotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  teamId: {
    type: String,
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const GaapNotification = mongoose.model('GaapNotification', gaapnotificationSchema);

module.exports = GaapNotification;
