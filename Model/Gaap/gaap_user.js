const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gappuserSchema = new Schema({
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
  manager: {
    type: String,
  },
  managerType: {
    type: String,
  },
  role: {
    type: String,
    enum: ['Sales Executive', 'Sales Manager', 'Finance Manager', 'Department Manager', 'Operational Executive', 'General Manager', 'Parent User','Audit Manager','Accounting Manager','Tax Supervisor','ICV Manager','Accounting Executive','Audit Executive','Tax Executive','ICV Executive'],
    required: true
  },
  department: {
    type: String,
    enum: ['Sales', 'Finance', 'Audit', 'Tax', 'ICV', 'Operations'],
  },
  profilePhoto: {
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
    ref: 'GaapUser'
  },
  targets: {
    daily: {
      officeVisits: { type: Number, default: 0 },
      meetings: { type: Number, default: 0 },
      proposals: { type: Number, default: 0 }
    },
    monthly: {
      closings: { type: Number, default: 0 }
    },
    quarterly: {
      closings: { type: Number, default: 0 }
    },
    yearly: {
      closings: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

gappuserSchema.virtual('name').get(function() {
  return this.fullName;
});

gappuserSchema.methods.isManager = function() {
  return ['Sales Manager', 'Finance Manager', 'Department Manager', 'General Manager', 'Parent User'].includes(this.role);
};

gappuserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};



const GaapUser = mongoose.model('GaapUser', gappuserSchema);

module.exports = GaapUser;
