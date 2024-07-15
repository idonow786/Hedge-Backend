const venom = require('venom-bot');
const User = require('../../../Model/whatsappUser');
const Message = require('../../../Model/messageWhatsapp');
const Business = require('../../../Model/Business');
const WhatsAppReport = require('../../../Model/whatsAppReport');
const WhatsAppSession = require('../../../Model/WhatsappSession');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');
const { uploadImageToFirebase } = require('../../../Firebase/uploadImage');

const upload = multer({ dest: 'uploads/' });

let clients = {};

const getMessages = async (req, res) => {
    const userId = req.adminId;

    if (!userId) {
        return res.status(400).send('Missing user ID');
    }

    try {
        const messages = await Message.find({ userId: userId });

        if (!messages || messages.length === 0) {
            return res.status(404).send('No messages found for this user');
        }

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages: ', error);
        res.status(500).send('Failed to fetch messages');
    }
};
const getReport = async (req, res) => {
    const userId = req.adminId;

    try {
        let report;

        if (userId) {
            report = await WhatsAppReport.findOne({ userId: userId });
            if (!report) {
                return res.status(404).send('Report not found for the specified user.');
            }
        } else {
            report = await WhatsAppReport.find();
        }

        res.status(200).json(report);
    } catch (error) {
        console.error('Error fetching WhatsApp report: ', error);
        res.status(500).send('Failed to fetch WhatsApp report.');
    }
};
module.exports = {  getMessages, upload, getReport };
