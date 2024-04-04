const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  ID: {
    type: Number,
    
  },
  Name: {
    type: String,
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
  },
  PhoneNo: {
    type: String,
  },
  Email: {
    type: String,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
