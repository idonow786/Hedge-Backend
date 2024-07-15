const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String },
  phoneNumber: { type: String, default: null },
  email: { type: String },
  Token: { type: String },
  subscriptionType: { type: String, enum: ['free', 'premium'], default: 'free' },
  messagesSentThisWeek: { type: Number, default: 0 },
  lastApiCall: { type: Date },
  sessionName: { type: String },
  base64QR: { type: String },
  sessionExpiry: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
