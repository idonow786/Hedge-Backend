const mongoose = require('mongoose');

const SnapUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
  },
  userId: {
    type: String,
  },
  snapid: {
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

const SnapUser = mongoose.model('SnapUser', SnapUserSchema);

module.exports = { SnapUser };
