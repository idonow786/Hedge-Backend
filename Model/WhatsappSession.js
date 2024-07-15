const mongoose = require('mongoose');

const whatsAppSessionSchema = new mongoose.Schema({
  userId: { type: String},
  sessionName: { type: String },
  isActive: { type: Boolean },
  lastActivity: { type: Date, default: Date.now },
  base64QR: String,
  sessionExpiry: Date
});

module.exports = mongoose.model('WhatsAppSession', whatsAppSessionSchema);
