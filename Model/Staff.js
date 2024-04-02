const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
  },
  StaffName: {
    type: String,
  },
  Gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  PhoneNo: {
    type: String,
  },
  Date: {
    type: Date,
    default: Date.now,
  },
  Email: {
    type: String,
    unique: true,
  },
  PicUrl: {
    type: String,
  },
  DateofBirth: {
    type: Date,
  },
  Description: {
    type: String,
  },
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;