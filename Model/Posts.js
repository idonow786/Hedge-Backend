const mongoose = require('mongoose');

const postsSchema = new mongoose.Schema({
 ID: {
  type: Number,
  default: () => Math.floor(Math.random() * 1000000),
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
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
});

const Posts = mongoose.model('Posts', postsSchema);

module.exports = Posts;