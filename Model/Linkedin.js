const mongoose = require('mongoose');

const linkedinUserSchema = new mongoose.Schema({
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
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
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

const LinkedInUser = mongoose.model('LinkedInUser', linkedinUserSchema);

const OAuthDataLinkedinSchema = new mongoose.Schema({
  state: String,
  userId: String,
});

const OAuthDataLinkedin = mongoose.model('OAuthDataLinkedin', OAuthDataLinkedinSchema);

module.exports = {OAuthDataLinkedin,LinkedInUser};
