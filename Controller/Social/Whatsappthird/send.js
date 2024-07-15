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





const QRcode = async (req, res) => {
    const userId = req.adminId;
    const sessionName = `session-${userId}`;
    let responseSent = false;
    let qrScanTimer;
    let retryCount = 0;
    const maxRetries = 3;

    const sendResponse = (status, data) => {
        if (!responseSent) {
            res.status(status).json(data);
            responseSent = true;
        }
    };

    const updateSessionActivity = async (userId) => {
        await WhatsAppSession.findOneAndUpdate(
            { userId: userId },
            { lastActivity: new Date() },
            { new: true }
        );
    };

    const removeInstanceAndSession = async (userId) => {
        console.log(`Removing instance and session for ${userId}`);
        if (clients[userId] && typeof clients[userId].close === 'function') {
            await clients[userId].close();
        }
        delete clients[userId];
        
        await WhatsAppSession.findOneAndUpdate(
            { userId: userId },
            { isActive: false, $unset: { base64QR: "", sessionExpiry: "" } }
        );
    };

    const initializeVenom = async () => {
        try {
            const client = await venom.create(
                sessionName,
                async (base64Qr, asciiQR, attempts, urlCode) => {
                    if (!responseSent) {
                        const base64Image = base64Qr.replace(/^data:image\/png;base64,/, '');
                        
                        await WhatsAppSession.findOneAndUpdate(
                            { userId: userId },
                            { 
                                base64QR: base64Image,
                                sessionExpiry: new Date(Date.now() + 5 * 60 * 1000)
                            },
                            { upsert: true, new: true }
                        );

                        sendResponse(200, {
                            success: true,
                            message: 'QR Code generated successfully',
                            qrCode: base64Image
                        });

                        qrScanTimer = setTimeout(() => removeInstanceAndSession(userId), 10000);
                    }
                },
                async (statusSession, session) => {
                    console.log('Status Session: ', statusSession);
                    console.log('Session name: ', session);

                    if (statusSession === 'qrReadSuccess' || statusSession === 'successChat') {
                        if (qrScanTimer) clearTimeout(qrScanTimer);

                        await WhatsAppSession.findOneAndUpdate(
                            { userId: userId },
                            { isActive: true },
                            { upsert: true }
                        );

                        await WhatsAppReport.findOneAndUpdate(
                            { userId: userId },
                            {
                                sessionName: sessionName,
                                userConnectedDate: new Date(),
                            },
                            { new: true, upsert: true }
                        );

                        if (statusSession === 'successChat') {
                            sendResponse(200, { success: true, session: true, message: 'WhatsApp connected successfully' });
                        }
                    }

                    if (statusSession === 'qrReadFail' || statusSession === 'autocloseCalled' || statusSession === 'desconnectedMobile' || statusSession === 'erroPageWhatsapp') {
                        await removeInstanceAndSession(userId);
                    }
                },
                {
                    headless: 'new',
                    devtools: false,
                    useChrome: true,
                    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
                    executablePath: '/usr/bin/google-chrome-stable',
                    disableSpins: true,
                    disableWelcome: true,
                    logQR: true,
                    autoClose: 60000,
                    createPathFileToken: true,
                    waitForLogin: true,
                    createOptions: {
                        browserArgs: ['--no-sandbox'],
                        useChrome: true,
                        puppeteerOptions: {
                            args: ['--no-sandbox', '--disable-setuid-sandbox'],
                            timeout: 120000
                        }
                    }
                }
            );

            clients[userId] = client;
            updateSessionActivity(userId);

            client.onStateChange((state) => {
                console.log('State changed: ', state);
                if (state === 'CONNECTED') {
                    console.log('Client is ready!');
                    updateSessionActivity(userId);
                } else if (state === 'DISCONNECTED') {
                    removeInstanceAndSession(userId);
                }
            });

            client.onMessage(() => {
                updateSessionActivity(userId);
            });

        } catch (error) {
            console.error('Error initializing venom-bot: ', error);
            await removeInstanceAndSession(userId);
        }
    };

    try {
        await removeInstanceAndSession(userId);

        await initializeVenom();

    } catch (error) {
        console.error('Error in QRcode function: ', error);
        sendResponse(500, { success: false, message: 'Internal server error' });
    }
};



const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sending = async (req, res) => {
    const { message, base64Image, contentType } = req.body;
    const userId = req.adminId;

    if (!req.file || !req.file.path) {
        return res.status(400).send('Missing Excel file');
    }

    if (!message) {
        return res.status(400).send('Missing required fields: message');
    }

    try {
        const session = await WhatsAppSession.findOne({ userId: userId, isActive: true });
        if (!session) {
            return res.status(400).send('WhatsApp session is not active. Please generate QR code and connect first.');
        }

        // if (!clients[userId]) {
        //     return res.status(400).send('Client is not initialized. Please reconnect to WhatsApp.');
        // }

        const business = await Business.findOne({ AdminID: userId });
        if (!business) {
            return res.status(400).send('Business details not found.');
        }

        const { BusinessName, BusinessPhoneNo } = business;

        let imageUrl = null;

        if (base64Image && contentType) {
            try {
                imageUrl = await uploadImageToFirebase(base64Image, contentType);
            } catch (error) {
                return res.status(500).send('Failed to upload image.');
            }
        }

        const file = req.file;
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let bulkMessagesCount = 0;
        const today = new Date().toISOString().split('T')[0];

        let report = await WhatsAppReport.findOne({ userId: userId });
        if (!report) {
            report = new WhatsAppReport({ userId: userId, sessionName: session.sessionName });
        }

        if (report.dailyMessages.get(today) && report.dailyMessages.get(today) >= 400) {
            return res.status(400).send('Daily message limit of 400 reached.');
        }

        for (const row of data) {
            let number = row.phone;

            if (!number) {
                continue;
            }

            number = String(number);

            const chatId = number.includes('@c.us') ? number : `${number}@c.us`;

            try {
                if (imageUrl) {
                    await clients[userId].sendImage(chatId, imageUrl, 'image', message);
                } else {
                    await clients[userId].sendText(chatId, message);
                }

                const newMessage = {
                    userId: req.adminId,
                    phoneNumber: number,
                    messages: [{
                        id: chatId,
                        from: BusinessPhoneNo,
                        to: number,
                        author: BusinessPhoneNo,
                        pushname: BusinessName,
                        message_type: imageUrl ? 'image' : 'text',
                        status: 'sent',
                        body: message,
                        imageUrl: imageUrl || null,
                        timestamp: new Date(),
                    }]
                };

                await Message.create(newMessage);
                bulkMessagesCount++;

                report.dailyMessages.set(today, (report.dailyMessages.get(today) || 0) + 1);

                if (report.dailyMessages.get(today) >= 400) {
                    break;
                }

                await delay(10000);

                await WhatsAppSession.findOneAndUpdate(
                    { userId: userId },
                    { lastActivity: new Date() }
                );

            } catch (error) {
                console.error('Error sending message to: ', number, error);
            }
        }

        const week = getWeekNumber(new Date()).toString();
        const month = (new Date().getMonth() + 1).toString();

        report.weeklyMessages.set(week, (report.weeklyMessages.get(week) || 0) + bulkMessagesCount);
        report.monthlyMessages.set(month, (report.monthlyMessages.get(month) || 0) + bulkMessagesCount);

        report.totalBulkMessages += bulkMessagesCount;
        report.lastMessageSentDate = new Date();

        await report.save();

        res.status(200).send('Messages sent successfully');
    } catch (error) {
        console.error('Error processing Excel file: ', error);
        res.status(500).send('Failed to process Excel file');
    }
};

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}



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
module.exports = { QRcode, sending, getMessages, upload, getReport };
