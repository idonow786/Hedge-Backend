const mongoose = require('mongoose');

const postsSchema = new mongoose.Schema({
  ID: {
    type: Number,
    required: true,
    unique: true,
  },
  SocialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Socials',
    required: true,
  },
  PostTitle: {
    type: String,
    required: true,
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