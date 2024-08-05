const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapcustomerContactSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  designation: {
    type: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String
  }
});

const gaapcustomerSchema = new Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  tradeLicenseNumber: {
    type: String,
    unique: true,
    required: true
  },
  landline: {
    type: String
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contacts: [gaapcustomerContactSchema],
  registeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
  },
  customerType: {
    type: String,
    enum: ['Individual', 'Company', 'Government'],
    required: true
  },
  industry: {
    type: String
  },
  annualTurnover: {
    type: Number
  },
  taxRegistrationNumber: {
    type: String
  },
  website: {
    type: String
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastInteractionDate: {
    type: Date
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Virtual for formatted address
gaapcustomerSchema.virtual('fullAddress').get(function() {
  const { street, city, state, country, postalCode } = this.address;
  return `${street}, ${city}, ${state}, ${country} ${postalCode}`.trim();
});

// Method to get primary contact
gaapcustomerSchema.methods.getPrimaryContact = function() {
  return this.contacts.length > 0 ? this.contacts[0] : null;
};

// Static method to find customers by sales person
gaapcustomerSchema.statics.findBySalesPerson = function(salesPersonId) {
  return this.find({ registeredBy: salesPersonId });
};

// Middleware to update lastInteractionDate before save
gaapcustomerSchema.pre('save', function(next) {
  this.lastInteractionDate = new Date();
  next();
});

const GaapCustomer = mongoose.model('GaapCustomer', gaapcustomerSchema);

module.exports = GaapCustomer;
