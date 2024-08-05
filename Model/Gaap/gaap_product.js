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
  priceType: {
    type: String,
    enum: ['Fixed Price', 'Variable Price'],
    required: true
  },
  price: {
    type: Number,
    required: function() {
      return this.priceType === 'Fixed Price'; // Price is required only for fixed price products
    }
  },
  timeDeadline: {
    type: Number,
    required: function() {
      return this.priceType === 'Fixed Price'; // Time deadline is required only for fixed price products
    }
  },
  turnoverRange: {
    type: String,
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
