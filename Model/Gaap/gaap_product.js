const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapproductSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String
  },
  department: {
    type: String,
    required: true
  },
  priceType: {
    type: String,
    enum: ['Fixed Price', 'Variable Price'],
    required: true
  },
  price: {
    type: Number,
    required: function() {
      return this.priceType === 'Fixed Price';
    }
  },
  timeDeadline: {
    type: Number,
    required: function() {
      return this.priceType === 'Fixed Price';
    }
  },
  turnoverRange: {
    type: String,
    required: function() {
      return this.priceType === 'Fixed Price';
    }
  },
  isVatProduct: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const GaapProduct = mongoose.model('GaapProduct', gaapproductSchema);

module.exports = GaapProduct;
