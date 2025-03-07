const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapcustomerContactSchema = new Schema({
  title: {
    type: String,
    enum: ['Mr', 'Ms', 'Mrs', 'Dr'],
    default: 'Mr'
  },
  name: {
    type: String,
  },
  designation: {
    type: String,
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

const gaapcustomerDocumentSchema = new Schema({
  documentType: {
    type: String,
    enum: ['tradeLicense', 'vatCertificate', 'otherDocuments'],
  },
  documentUrl: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const gaapcustomerSchema = new Schema({
  companyName: {
    type: String,
    trim: true
  },
  landline: {
    type: String
  },
  mobile: {
    type: String,
  },
  teamId: {
    type: String,
  },
  branchId: {
    type: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  contactPerson1: gaapcustomerContactSchema,
  contactPerson2: gaapcustomerContactSchema,
  trNumber: {
    type: String,
  },
  documents: [gaapcustomerDocumentSchema],
  industryType: {
    type: String,
  },
  registeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastInteractionDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for formatted address
gaapcustomerSchema.virtual('fullAddress').get(function() {
  const { street, city, state, country, postalCode } = this.address;
  return `${street}, ${city}, ${state}, ${country} ${postalCode}`.trim();
});

// Virtual for formatted contact person names with titles
gaapcustomerSchema.virtual('contactPerson1FullName').get(function() {
  const { title, name } = this.contactPerson1;
  return `${title}. ${name}`.trim();
});

gaapcustomerSchema.virtual('contactPerson2FullName').get(function() {
  const { title, name } = this.contactPerson2;
  return `${title}. ${name}`.trim();
});

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
