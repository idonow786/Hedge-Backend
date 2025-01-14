const mongoose = require('mongoose');

// 🏗️ Schema for modules within modulePermissions
const moduleSchema = new mongoose.Schema({
  name: String,
  link: String,
  picUrl: String,
  permission: Boolean
});

// 🎯 Schema for features
const featuresSchema = new mongoose.Schema({
  Expense: Boolean,
  Projects: Boolean,
  Customers: Boolean,
  Staff: Boolean,
  SocialMedia: Boolean,
  Whatsapp: Boolean
});

// 📊 Schema for totals
const totalsSchema = new mongoose.Schema({
  TotalStaff: Number,
  TotalExpenses: Number,
  TotalCustomers: Number,
  TotalSocialMediaPosts: Number
});

// 👤 Schema for user details
const userSchema = new mongoose.Schema({
  id: String,
  username: String,
  email: String,
  role: String,
  fullName: String,
  department: String,
  CompanyActivity: String
});

// 🏢 Schema for business details
const businessSchema = new mongoose.Schema({
  _id: String,
  AdminID: String,
  BusinessName: String,
  BusinessAddress: String,
  BusinessPhoneNo: String,
  BusinessEmail: String,
  CompanyType: String,
  CompanyActivity: String,
  OwnerName: String,
  NumberofEmployees: Number,
  YearofEstablishment: String,
  BusinessType: String,
  Services: [String],
  Products: [String],
  ServiceandProduct: [String],
  ID: Number,
  Date: Date
});

// 🔐 Main LoginResponse Schema
const loginResponseSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  message: String,
  token: String,
  role: String,
  features: featuresSchema,
  totals: totalsSchema,
  modulePermissions: {
    modules: [moduleSchema],
    userId: String,
    adminId: String,
    createdAt: Date,
    updatedAt: Date
  },
  user: userSchema,
  business: businessSchema,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // 📅 Adds createdAt and updatedAt timestamps
});

// 🔄 Pre-save middleware to update lastUpdated
loginResponseSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const LoginResponse = mongoose.model('LoginResponse', loginResponseSchema);

module.exports = LoginResponse; 