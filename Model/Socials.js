const mongoose = require('mongoose');

const socialsSchema = new mongoose.Schema({
  ID: {
    type: Number,
  },
  Userid: {
    type: Number,
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
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Admin,
  },
});

const Socials = mongoose.model('Socials', socialsSchema);

module.exports = Socials;