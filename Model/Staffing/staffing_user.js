const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffinguserSchema = new Schema({
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
  teamId: {
    type: String,
  },
  role: {
    type: String,
    enum: ['Security Guard','HR Personnel' ],
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
    ref: 'StaffingUser'
  },
}, {
  timestamps: true
});

staffinguserSchema.virtual('name').get(function() {
  return this.fullName;
});


staffinguserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};



const StaffingUser = mongoose.model('StaffingUser', staffinguserSchema);

module.exports = StaffingUser;
