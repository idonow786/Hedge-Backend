const mongoose = require('mongoose');
const validator = require('validator');

const customerSchema = new mongoose.Schema({
  // Basic Info
  customerType: {
    type: String,
    enum: ['individual', 'corporate'],
    required: [true, 'Customer type is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required']
  },

  // Address
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State/Province is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    }
  },

  // Corporate Specific Fields
  corporateDetails: {
    companyName: {
      type: String,
      required: function() {
        return this.customerType === 'corporate';
      }
    },
    taxId: {
      type: String,
      required: function() {
        return this.customerType === 'corporate';
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return validator.isURL(v);
        },
        message: 'Please provide a valid URL'
      }
    }
  },

  // Additional Information
  tags: [{
    type: String,
    trim: true
  }],
  preferredLanguage: {
    type: String,
    default: 'en'
  },
  paymentTerms: {
    type: String,
    default: 'Immediate'
  },
  currency: {
    type: String,
    default: 'USD'
  },

  // Status and Notes
  isActive: {
    type: Boolean,
    default: true
  },
  internalNotes: {
    type: String
  },

  // Custom Properties (Optional)
  customProperties: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    },
    type: {
      type: String,
      default: 'text'
    }
  }],

  // Authentication
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },

  // Metadata
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ 'corporateDetails.companyName': 1 });
customerSchema.index({ teamId: 1 });

// Pre-save middleware to handle corporate validation
customerSchema.pre('save', function(next) {
  if (this.customerType === 'corporate') {
    if (!this.corporateDetails.companyName || !this.corporateDetails.taxId) {
      next(new Error('Company name and Tax ID are required for corporate customers'));
    }
  }
  next();
});

const Atis_Customer = mongoose.model('Atis_Customer', customerSchema);
module.exports = Atis_Customer; 