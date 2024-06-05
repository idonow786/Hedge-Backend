// models/Instagram.js
const mongoose = require('mongoose');

const InstagramUserSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  instagramId: {
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

const InstagramUser = mongoose.model('InstagramUser', InstagramUserSchema);

const OAuthDataInstagramSchema = new mongoose.Schema({
  state: String,
  userId: String,
});

const OAuthDataInstagram = mongoose.model('OAuthDataInstagram', OAuthDataInstagramSchema);

module.exports = { InstagramUser, OAuthDataInstagram };
