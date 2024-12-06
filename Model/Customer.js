const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  ID: {
    type: Number,
    
  },
  Name: {
    type: String,
  },
  Number: {
    type: String,
  },
  CompanyName: {
    type: String,
  },
  DocumentsUrls: [{
    type: String,
  }],
  PicUrl: {
    type: String,
  },
  DateJoined: {
    type: Date,
    default: Date.now,
  },
  DateofBirth: {
    type: Date,
  },
  PhoneNo: {
    type: String,
  },
  Email: {
    type: String,
  },
  ProjectHistory: {
    type: String,
  },
  ProjectsId: [{
    type: String,
  }],
  FinancialInformation: {
    type: String,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  customProperties: [{
    propertyName: {
      type: String,
      required: true
    },
    propertyType: {
      type: String,
      enum: ['string', 'number', 'boolean'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    }
  }]
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
