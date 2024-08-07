const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fixedPriceProductSchema = new Schema({
  category: {
    type: String,
    enum: ['External Audit', 'ICV', 'ICV+external Audit'],
    required: true
  },
  turnover: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  timeDeadline: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const FixedPriceProduct = mongoose.model('FixedPriceProduct', fixedPriceProductSchema);

module.exports = FixedPriceProduct;
