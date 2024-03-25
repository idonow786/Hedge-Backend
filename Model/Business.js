const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  BusinessTitle: {
    type: String,
    required: true,
  },
  Address: {
    type: String,
    required: true,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  PhoneNo: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Description: {
    type: String,
  },
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;