// models/whatsappModel.js
const mongoose = require('mongoose');

const whatsappSchema = new mongoose.Schema({
  phoneNumber: { type: String },
  phoneNumberId: { type: String },
  verified: { type: Boolean, default: false },
  owner: { type: String, required: true } 
});

module.exports = mongoose.model('WhatsApp', whatsappSchema);
