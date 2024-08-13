const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const variablePriceProductSchema = new Schema({
  adminId: {
    type: String,
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const VariablePriceProduct = mongoose.model('VariablePriceProduct', variablePriceProductSchema);

module.exports = VariablePriceProduct;