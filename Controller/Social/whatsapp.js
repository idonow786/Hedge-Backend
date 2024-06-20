
// controllers/adminController.js

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');
const WhatsApp = require('../../Model/whatsapp');
const { WHATSAPP_API_URL, ACCESS_TOKEN } = require('../../Config/whatsappconfig');

const getPhoneNumberId = async (phoneNumber) => {
    try {
        const response = await axios.get(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_BUSINESS_ID}/phone_numbers`, {
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
    const { phoneNumber, owner } = req.body;

    try {
        const phoneNumberId = await getPhoneNumberId(phoneNumber);
        await axios.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
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

// controllers/messageController.js
const sendMessages = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', req.file.path);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const message = req.body.message;
        const phoneNumbers = worksheet.map(row => row.numbers);

        const owner = req.body.owner;
        const admin = await WhatsApp.findOne({ owner, verified: true });

        if (!admin) {
            return res.status(400).send('Owner phone number is not verified.');
        }

        const phoneNumberId = admin.phoneNumberId;

        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];

            await axios.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: { body: message }
            }, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if ((i + 1) % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay after every 5 messages
            }
        }

        res.status(200).send('Messages sent successfully');
    } catch (error) {
        console.error('Error sending messages:', error);
        res.status(500).send('An error occurred while sending messages');
    } finally {
        fs.unlinkSync(req.file.path); // Clean up the uploaded file
    }
};


module.exports = { verifyPhoneNumber, sendMessages };