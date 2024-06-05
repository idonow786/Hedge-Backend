// models/Facebook.js
const mongoose = require('mongoose');

const facebookUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  facebookId: {
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

const FacebookUser = mongoose.model('FacebookUser', facebookUserSchema);

const OAuthDataFacebookSchema = new mongoose.Schema({
  state: String,
  userId: String,
});

const OAuthDataFacebook = mongoose.model('OAuthDataFacebook', OAuthDataFacebookSchema);

module.exports = { FacebookUser, OAuthDataFacebook };
