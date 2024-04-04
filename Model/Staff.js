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
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;