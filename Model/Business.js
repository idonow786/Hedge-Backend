const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
  },
  BusinessName: {
    type: String,
    required: true,
  },
  BusinessAddress: {
    type: String,
    required: true,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  BusinessPhoneNo: {
    type: String,
  },
  BusinessEmail: {
    type: String,
  },
  CompanyType: {
    type: String,
  },
  CompanyActivity: {
    type: String,
  },
  OwnerName: {
    type: String,
  },
  NumberofEmployees: {
    type: Number,
    default: 0,
  },
  YearofEstablishment: {
    type: Date,
  },
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;