const mongoose = require('mongoose');

const socialsSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
  },
  Userid: {
    type: Number,
    unique: true,
  },
  SocialAccounts: [
    {
      Name: {
        type: String,
      },
      dateAdded: {
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