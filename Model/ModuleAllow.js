const mongoose = require('mongoose');

const moduleAllowSchema = new mongoose.Schema({
  moduleName: {
    type: [String],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  permission: {
    type: Boolean,
    default: false  
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