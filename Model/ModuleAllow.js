const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ''
  },
  picUrl: {
    type: String,
    default: ''
  },
  permission: {
    type: Boolean,
    default: false
  }
});

const moduleAllowSchema = new mongoose.Schema({
  modules: [moduleSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

const ModuleAllow = mongoose.model('ModuleAllow', moduleAllowSchema);

module.exports = ModuleAllow; 