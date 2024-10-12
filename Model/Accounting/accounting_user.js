const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountinguserSchema = new Schema({
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
    enum: ['admin','accountant' ],
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

accountinguserSchema.virtual('name').get(function() {
  return this.fullName;
});


accountinguserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};



const AccountingUser = mongoose.model('AccountingUser', accountinguserSchema);

module.exports = AccountingUser;
