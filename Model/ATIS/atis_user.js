const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const atisuserSchema = new Schema({
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
  fullName: {
    type: String,
    required: true
  },
  teamId: {
    type: String,
  },
  role: {
    type: String,
    enum: [
      'admin',      // Complete system control, user management, configurations
      'frontDesk',      // Front desk agent for complaint registration
      'serviceManager', // Manages service teams and assignments
      'technician',     // Field technicians/operatives
      'channelPartner', // External partners who can register complaints
      'accountant',     // For billing and AMC management
      'client'          // Clients who can view their complaints/reports
    ],
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
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
}, {
  timestamps: true
});

atisuserSchema.virtual('name').get(function() {
  return this.fullName;
});


atisuserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};



const ATISUser = mongoose.model('ATISUser', atisuserSchema);

module.exports = ATISUser;
