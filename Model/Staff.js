const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  StaffName: {
    type: String,
    required: true,
  },
  Gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  PhoneNo: {
    type: String,
    required: true,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  PicUrl: {
    type: String,
  },
  DateofBirth: {
    type: Date,
    required: true,
  },
  Description: {
    type: String,
  },
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;