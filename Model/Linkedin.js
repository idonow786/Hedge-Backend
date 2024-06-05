// models/LinkedIn.js
const mongoose = require('mongoose');

const LinkedInUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  linkedinId: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LinkedInUser = mongoose.model('LinkedInUser', LinkedInUserSchema);

module.exports = { LinkedInUser };

