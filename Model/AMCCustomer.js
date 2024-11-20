const mongoose = require('mongoose');

const customPropertySchema = new mongoose.Schema({
  propertyName: {
    type: String,
    required: true
  },
  propertyType: {
    type: String,
    required: true
  },
  propertyValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

const amccustomerSchema = new mongoose.Schema({
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
  customProperties: [customPropertySchema]
});

// Middleware to validate property values based on type
amccustomerSchema.pre('save', function(next) {
  if (this.customProperties) {
    for (const prop of this.customProperties) {
      if (prop.propertyType === 'date' && !(prop.propertyValue instanceof Date)) {
        try {
          prop.propertyValue = new Date(prop.propertyValue);
        } catch (error) {
          return next(new Error(`Invalid date value for property: ${prop.propertyName}`));
        }
      }
    }
  }
  next();
});

const AMCCustomer = mongoose.model('AMCCustomer', amccustomerSchema);

module.exports = AMCCustomer;
