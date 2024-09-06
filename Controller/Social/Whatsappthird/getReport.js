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

        const currentDate = new Date();
        const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        let weeklyMessages = 0;
        for (let [date, count] of report.weeklyMessages) {
            if (new Date(date) >= oneWeekAgo) {
                weeklyMessages += count;
            }
        }

        const lastMessageDate = report.lastMessageSentDate ? report.lastMessageSentDate.toISOString().split('T')[0] : null;

        const reportData = {
            totalUsers: report.totalUsers,
            totalBulkMessages: report.totalBulkMessages,
            weeklyMessages: weeklyMessages,
            lastMessageSentDate: lastMessageDate,
            lastMessageTotalBulkMessages: report.totalBulkMessages
        };

        res.status(200).json({
            message: 'WhatsApp report generated successfully',
            reports: {
                users: report.totalUsers,
                bulkMessages: report.totalBulkMessages,
                weeklyMessages: weeklyMessages,
                lastMessageDate: lastMessageDate,
                lastMessageTotalBulkMessages: report.totalBulkMessages
            },
        });
    } catch (error) {
        console.error('Error fetching WhatsApp report: ', error);
        res.status(500).send('Failed to fetch WhatsApp report.');
    }
};


module.exports = {  getMessages, upload, getReport };
