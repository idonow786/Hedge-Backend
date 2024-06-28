// controllers/messageController.js

const axios = require('axios');
const WhatsApp = require('../../../Model/whatsapp');
const { WHATSAPP_API_URL, ACCESS_TOKEN } = require('../../../Config/whatsappconfig');

const replyToCustomer = async (req, res) => {
  const {  customerPhoneNumber, message } = req.body;
  const owner = req.adminId;
  try {
    const whatsapp = await WhatsApp.findOne({ owner });

    if (!whatsapp) {
      return res.status(404).send('Owner not found.');
    }

    const customerMessage = {
      sender: owner,
      content: message,
      timestamp: new Date()
    };

    whatsapp.messages.push(customerMessage);
    await whatsapp.save();

    await axios.post(`${WHATSAPP_API_URL}/${whatsapp.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: customerPhoneNumber,
      text: { body: message }
    }, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).send('Message sent and saved.');
  } catch (error) {
    console.error('Error replying to customer:', error);
    res.status(500).send('An error occurred while replying to the customer.');
  }
};



// controllers/messageController.js

const getAllMessages = async (req, res) => {
    const owner  = req.adminId;

    try {
        const whatsapp = await WhatsApp.findOne({ owner });

        if (!whatsapp) {
            return res.status(404).send('Owner not found.');
        }

        res.status(200).json(whatsapp.messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('An error occurred while fetching messages.');
    }
};



module.exports = { replyToCustomer,getAllMessages };
