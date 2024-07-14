const axios = require('axios');
const multer = require('multer');
const XLSX = require('xlsx');
const User = require('../../../Model/whatsappUser'); 
const Message = require('../../../Model/messageWhatsapp');

const upload = multer({ dest: 'uploads/' });

const sendMessage = async (req, res) => {
  const { message, quoted_message_id = '' } = req.body;
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

    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      const phoneNumber = row.phone;

      if (!phoneNumber) {
        continue;
      }

      const options = {
        method: 'POST',
        url: 'https://whatsapp-messaging-hub.p.rapidapi.com/WhatsappSendMessage',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': process.env.RAPIDAPI_HOST,
          'Content-Type': 'application/json'
        },
        data: {
          token,
          phone_number_or_group_id: phoneNumber,
          is_group: false,
          message,
          quoted_message_id
        }
      };

      try {
        const response = await axios.request(options);
        const messageData = response.data.Messages[0];
        console.log(`Message sent to ${phoneNumber}:`, messageData);

        const existingConversation = await Message.findOne({ userId, phoneNumber });

        if (existingConversation) {
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
        }
      } catch (error) {
        console.error(`Error sending message to ${phoneNumber}:`, error.response ? error.response.data : error.message);
      }
    }

    res.json({ message: 'Messages sent and conversations saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while sending messages');
  }
};

module.exports = { sendMessage, upload };
