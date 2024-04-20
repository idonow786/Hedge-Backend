const mongoose = require('mongoose');

const tiktokUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  tiktokId: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  openId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TikTokUser = mongoose.model('TikTokUser', tiktokUserSchema);


const OAuthDataTiktokSchema = new mongoose.Schema({
  state: String,
  userId: String,
});

const OAuthTiktokData = mongoose.model('OAuthTiktokData', OAuthDataTiktokSchema);

module.exports = {OAuthTiktokData,TikTokUser};
