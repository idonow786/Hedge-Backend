const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: String },
  phoneNumber: { type: String },
  messages: [
    {
      id: { type: String },
      from: { type: String },
      to: { type: String },
      author: { type :String},
      pushname: { type:String },
      message_type: { type: String},
      status: { type: String},
      body: { type: String },
      caption: { type: String },
      forwarded: { type: Number },
      quoted_message_id: { type: String },
      mentioned_ids: { type: [String] },
      timestamp: { type: Date },
      fileUrl:{type:String}
    }
  ]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
