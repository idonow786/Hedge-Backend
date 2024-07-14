const axios = require('axios');
const User = require('../../../Model/whatsappUser'); 
const Message = require('../../../Model/messageWhatsapp');

const getAllMessages = async (req, res) => {
  const userId = req.adminId;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).send('User not found');
    }

    const token = user.Token;

    if (!token) {
      return res.status(400).send('Token not found for this user');
    }

    const currentDate = new Date();
    const lastApiCall = user.lastApiCall;
    const oneDay = 24 * 60 * 60 * 1000;

    if (lastApiCall && (currentDate - lastApiCall) < oneDay) {
      const messages = await Message.find({ userId });
      return res.json({ message: 'Messages fetched from the database', messages });
    }

    const options = {
      method: 'GET',
      url: 'https://whatsapp-messaging-hub.p.rapidapi.com/WhatsappGetMessages',
      params: {
        token,
        pageNumber: '1'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST
      }
    };

    const response = await axios.request(options);
    const messages = response.data.Messages;
    const savedMessages = [];

    for (const messageData of messages) {
      if (messageData.from.includes('@newsletter')) {
        continue;
      }

      const phoneNumber = messageData.from.includes('@c.us') ? messageData.from.split('@')[0] : messageData.to.split('@')[0];

      const existingConversation = await Message.findOne({ userId, phoneNumber });

      if (existingConversation) {
        const existingMessage = existingConversation.messages.find(msg => msg.id === messageData.id);

        if (!existingMessage) {
          existingConversation.messages.push({
            id: messageData.id,
            from: messageData.from,
            to: messageData.to,
            author: messageData.author,
            pushname: messageData.pushname,
            message_type: messageData.message_type,
            status: messageData.status,
            body: messageData.body,
            caption: messageData.caption,
            forwarded: messageData.forwarded,
            quoted_message_id: messageData.quoted_message_id,
            mentioned_ids: messageData.mentioned_ids,
            timestamp: messageData.timestamp
          });
          savedMessages.push(messageData); 
        }
        await existingConversation.save();
      } else {
        const newConversation = new Message({
          userId,
          phoneNumber,
          messages: [
            {
              id: messageData.id,
              from: messageData.from,
              to: messageData.to,
              author: messageData.author,
              pushname: messageData.pushname,
              message_type: messageData.message_type,
              status: messageData.status,
              body: messageData.body,
              caption: messageData.caption,
              forwarded: messageData.forwarded,
              quoted_message_id: messageData.quoted_message_id,
              mentioned_ids: messageData.mentioned_ids,
              timestamp: messageData.timestamp
            }
          ]
        });
        await newConversation.save();
        savedMessages.push(messageData); 
      }
    }

    user.lastApiCall = currentDate;
    await user.save();

    res.json({ message: 'Messages fetched and saved successfully', savedMessages });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching messages');
  }
};

module.exports = { getAllMessages };
