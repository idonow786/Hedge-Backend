// models/Twitter.js
const mongoose = require('mongoose');

const TwitterUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  twitterId: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  accessTokenSecret: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  codeVerifier: {
    type: String,
    required: true,
  },
  generatedState: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TwitterUser = mongoose.model('TwitterUser', TwitterUserSchema);

module.exports = { TwitterUser };
