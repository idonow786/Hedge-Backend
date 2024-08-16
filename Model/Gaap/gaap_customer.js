const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapcustomerContactSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
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
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const gaapcustomerSchema = new Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  landline: {
    type: String
  },
  mobile: {
    type: String,
    required: true
  },
  teamId: {
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
    unique: true,
    required: true
  },
  documents: [gaapcustomerDocumentSchema],
  industryType: {
    type: String,
    required: true
  },
  registeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
    required: true
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
