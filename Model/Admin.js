const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
  },
  Name: {
    type: String,
  },
  Email: {
    type: String,
  },
  PicUrl: {
    type: String,
  },
  Password: {
    type: String,
  },
  Gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;