const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  from: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const Reply = mongoose.model('Reply', replySchema);
module.exports = Reply;
