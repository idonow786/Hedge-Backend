const mongoose = require('mongoose');

const postsSchema = new mongoose.Schema({
  ID: {
    type: Number,
    unique: true,
  },
  SocialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Socials',
  },
  PostTitle: {
    type: String,
  },
  PostPics: [
    {
      type: String,
    },
  ],
  PostDescription: {
    type: String,
  },
  CreatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Posts = mongoose.model('Posts', postsSchema);

module.exports = Posts;