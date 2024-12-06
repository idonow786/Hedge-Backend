const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const salesuserSchema = new Schema({
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

salesuserSchema.virtual('name').get(function() {
  return this.fullName;
});


salesuserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};



const SalesUser = mongoose.model('SalesUser', salesuserSchema);

module.exports = SalesUser;
