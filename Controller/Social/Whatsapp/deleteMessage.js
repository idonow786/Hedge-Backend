// controllers/messageController.js

const WhatsApp = require('../../../Model/whatsapp');

const deleteMessage = async (req, res) => {
  const { messageId } = req.body;
  const owner = req.adminId;
  try {
    const whatsapp = await WhatsApp.findOne({ owner });

    if (!whatsapp) {
      return res.status(404).send('Owner not found.');
    }

    const messageIndex = whatsapp.messages.findIndex(msg => msg._id.toString() === messageId);

    if (messageIndex === -1) {
      return res.status(404).send('Message not found.');
    }

    whatsapp.messages.splice(messageIndex, 1);
    await whatsapp.save();

    res.status(200).send('Message deleted successfully.');
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).send('An error occurred while deleting the message.');
  }
};

module.exports = { deleteMessage };
