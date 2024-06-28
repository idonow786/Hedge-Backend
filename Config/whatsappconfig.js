// config.js
const dotenv = require('dotenv');

dotenv.config();


module.exports = {
  WHATSAPP_API_URL: 'https://graph.facebook.com/v19.0',
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_BUSINESS_ID: process.env.WHATSAPP_BUSINESS_ID,
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
  WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL
};
