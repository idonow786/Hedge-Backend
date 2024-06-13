// models/LinkedIn.js
const mongoose = require('mongoose');

const LinkedInUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
  },
  userId: {
    type: String,
  },
  linkedinId: {
    type: String,
    unique: true,
  },
  accessToken: {
    type: String,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LinkedInUser = mongoose.model('LinkedInUser', LinkedInUserSchema);

module.exports = { LinkedInUser };

