// models/whatsappModel.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const whatsappSchema = new mongoose.Schema({
  phoneNumber: { type: String },
  phoneNumberId: { type: String },
  verified: { type: Boolean, default: false },
  owner: { type: String, required: true },
  messages: [messageSchema]
});

module.exports = mongoose.model('WhatsApp', whatsappSchema);