const mongoose = require('mongoose');

const facebookUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  facebookId: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FacebookUser = mongoose.model('FacebookUser', facebookUserSchema);

module.exports = FacebookUser;