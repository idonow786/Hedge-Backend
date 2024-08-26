// fixedPriceProductModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fixedPriceProductSchema = new Schema({
  adminId: {
    type: String,
  },
  auditType: {
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
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const FixedPriceProduct = mongoose.model('FixedPriceProduct', fixedPriceProductSchema);

module.exports = FixedPriceProduct;