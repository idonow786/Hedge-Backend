// twitterModel.js
const mongoose = require('mongoose');

const twitterSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  twitterId: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Twitter = mongoose.model('Twitter', twitterSchema);

const OAuthDataSchema = new mongoose.Schema({
  state: String,
  codeVerifier: String,
});

const OAuthData = mongoose.model('OAuthData', OAuthDataSchema);

module.exports = {
  Twitter,
  OAuthData,
};