const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String },
  phoneNumber: { type: String, unique: true},
  email: { type: String, unique: true},
  Token: { type: String },
  subscriptionType: { type: String, enum: ['free', 'premium'], default: 'free' },
  messagesSentThisWeek: { type: Number, default: 0 },
  lastApiCall: { type: Date },
  sessionName: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
