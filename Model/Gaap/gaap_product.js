const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapProjectProductSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
    required: true
  },
  baseProduct: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProduct',
  },
  name: {
    type: String,
    required: true
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
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  timeDeadline: {
    type: Date,
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

const GaapProjectProduct = mongoose.model('GaapProjectProduct', gaapProjectProductSchema);

module.exports = GaapProjectProduct;
