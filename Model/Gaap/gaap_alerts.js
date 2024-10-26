const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapalertSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
    required: true
  },
  message: {
    type: String,
    required: true
  },
  department: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false
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

const GaapAlert = mongoose.model('GaapAlert', gaapalertSchema);

module.exports = GaapAlert;
