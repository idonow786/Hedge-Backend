const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  Name: {
    type: String,
    required: true,
  },
  PicUrl: {
    type: String,
  },
  DateJoined: {
    type: Date,
    default: Date.now,
  },
  DateofBirth: {
    type: Date,
    required: true,
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
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
