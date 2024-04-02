const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
  },
  BusinessTitle: {
    type: String,
  },
  Address: {
    type: String,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  PhoneNo: {
    type: String,
  },
  Email: {
    type: String,
    unique: true,
  },
  Description: {
    type: String,
  },
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;