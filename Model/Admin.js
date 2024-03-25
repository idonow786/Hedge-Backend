const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  PicUrl: {
    type: String,
  },
  Password: {
    type: String,
    required: true,
  },
  Gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;