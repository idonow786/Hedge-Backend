// models/Twitter.js
const mongoose = require('mongoose');

const TwitterUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
  },
  userId: {
    type: String,
  },
  twitterId: {
    type: String,
    default:'null'

  },
  accessToken: {
    type: String,
  },
  accessTokenSecret: {
    type: String,
  },
  name: {
    type: String,
  },
  session: {
    type: String,
  },
  codeVerifier: {
    type: String,
  },
  generatedState: {
    type: String,
  },
  username: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TwitterUser = mongoose.model('TwitterUser', TwitterUserSchema);

module.exports = { TwitterUser };
