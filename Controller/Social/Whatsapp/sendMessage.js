// controllers/messageController.js

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const axios = require('axios');
const WhatsApp = require('../../../Model/whatsapp');
const { WHATSAPP_API_URL, ACCESS_TOKEN } = require('../../../Config/whatsappconfig');

const sendMessages = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', req.file.path);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const message = req.body.message;
        const phoneNumbers = worksheet.map(row => row.numbers);

        const owner = req.adminId;
        const admin = await WhatsApp.findOne({ owner, verified: true });

        if (!admin) {
            return res.status(400).send('Owner phone number is not verified.');
        }

        const phoneNumberId = admin.phoneNumberId;

        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];

            await axios.post(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
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

            admin.messages.push({ sender: owner, content: message });
        }

        await admin.save();
        res.status(200).send('Messages sent successfully.');
    } catch (error) {
        console.error('Error sending messages:', error);
        res.status(500).send('An error occurred while sending messages.');
    }
};

module.exports = { sendMessages };
