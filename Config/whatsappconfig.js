// config.js
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
    ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  };
  