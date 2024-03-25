const mongoose = require('mongoose');

const socialsSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  SocialAccounts: [
    {
      Title: {
        type: String,
      },
      Platform: {
        type: String,
      },
      AccessToken: {
        type: String,
      },
      AccessTokenSecret: {
        type: String,
      },
      ConsumerKey: {
        type: String,
      },
      ConsumerSecret: {
        type: String,
      },
      RefreshToken: {
        type: String,
      },
      ExpiresAt: {
        type: Date,
      },
    },
  ],
  PostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  UpdatedDate: {
    type: Date,
    default: Date.now,
  },
});

const Socials = mongoose.model('Socials', socialsSchema);

module.exports = Socials;