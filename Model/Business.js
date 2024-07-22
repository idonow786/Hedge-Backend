const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  ID: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000),
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  BusinessName: {
    type: String,
  },
  BusinessAddress: {
    type: String,
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
    type: String,
  },
  BusinessType: {
    type: String,
    enum: ['Services', 'Product','Service and Product'],
  },
  Services: [
    {
      type: String,
    },
  ],
  Products: [
    {
      type: String,
    },
  ],
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;