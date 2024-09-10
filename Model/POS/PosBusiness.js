const mongoose = require('mongoose');

const POSbusinessSchema = new mongoose.Schema({
  ID: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000),
  },
  AdminID: {
    type: String
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
  ServiceandProduct: [
    {
      type: String,
    },
  ],

});

const POSBusiness = mongoose.model('POSBusiness', POSbusinessSchema);

module.exports = POSBusiness;