// controllers/adminController.js

const axios = require('axios');
const WhatsApp = require('../../../Model/whatsapp');
const { WHATSAPP_API_URL, ACCESS_TOKEN } = require('../../../Config/whatsappconfig');

const getPhoneNumberId = async (phoneNumber) => {
    try {
        const response = await axios.get(`${WHATSAPP_API_URL}/${process.env.WHATSAPP_BUSINESS_ID}/phone_numbers`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });

        const phoneNumbers = response.data.data;
        const phoneNumberData = phoneNumbers.find(pn => pn.display_phone_number === phoneNumber);

        if (phoneNumberData) {
            return phoneNumberData.id;
        } else {
            throw new Error('Phone number not found');
        }
    } catch (error) {
        console.error('Error retrieving phone number ID:', error);
        throw error;
    }
};

const verifyPhoneNumber = async (req, res) => {
    const { phoneNumber } = req.body;
    const owner=req.adminId;
    try {
        const phoneNumberId = await getPhoneNumberId(phoneNumber);
        await axios.post(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'otp',
            otp: { type: 'numeric', length: 6 }
        }, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const whatsapp = new WhatsApp({ phoneNumber, phoneNumberId, owner });
        await whatsapp.save();

        res.status(200).send('OTP sent and phone number saved.');
    } catch (error) {
        console.error('Error verifying phone number:', error);
        res.status(500).send('An error occurred while verifying the phone number.');
    }
};

module.exports = { verifyPhoneNumber };
