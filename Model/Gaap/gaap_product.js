const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapProjectProductSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
  },
  baseProduct: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProduct',
  },
  name: {
    type: String,
  },
  category: {
    type: String,
  },
  subCategory: {
    type: String
  },
  department: {
    type: String,
  },
  teamId: {
    type: String,
  },
  branchId: {
    type: String,
  },
  priceType: {
    type: String,
    enum: ['Fixed', 'Variable'],
  },
  price: {
    type: Number,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  timeDeadline: {
    type: String,
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
