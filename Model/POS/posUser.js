const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const posuserSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  businessPhpId:{
    type: String,
  },
  fullName: {
    type: String,
    required: true
  },
  manager: {
    type: String,
  },
  managerType: {
    type: String,
  },
  teamId: {
    type: String,
  },
  role: {
    type: String,
    required: true
  },
  department: {
    type: String,
  },
  profilePhoto: {
    type: String
  },
  companyActivity: {
    type: String
  },
  address: {
    type: String
  },
  nationality: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: String,
    
  },

}, {
  timestamps: true
});

posuserSchema.virtual('name').get(function() {
  return this.fullName;
});



posuserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};



const POSUser = mongoose.model('POSUser', posuserSchema);

module.exports = POSUser;
