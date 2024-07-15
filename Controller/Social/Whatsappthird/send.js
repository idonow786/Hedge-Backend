const venom = require('venom-bot');
const User = require('../../../Model/whatsappUser');
const Message = require('../../../Model/messageWhatsapp');
const Business = require('../../../Model/Business');
const WhatsAppReport = require('../../../Model/whatsAppReport');
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
    let inactivityTimer;
    let qrScanTimer;
    let retryCount = 0;
    const maxRetries = 3;

    const sendResponse = (status, data) => {
        if (!responseSent) {
            res.status(status).json(data);
            responseSent = true;
        }
    };

    const closeClientAfterInactivity = (client) => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            console.log(`Closing client for ${userId} due to inactivity`);
            if (client && typeof client.close === 'function') {
                client.close();
            }
            delete clients[userId];
        }, 5 * 60 * 1000);
    };

    const removeInstanceAndSession = async (client) => {
        console.log(`Removing instance and session for ${userId}`);
        if (client && typeof client.close === 'function') {
            await client.close();
        }
        delete clients[userId];
        
        await User.findOneAndUpdate(
            { userId: userId },
            { $unset: { base64QR: "", sessionExpiry: "" }, sessionActive: false }
        );
        
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying QR code generation. Attempt ${retryCount} of ${maxRetries}`);
            initializeVenom();
        } else {
            sendResponse(408, { success: false, message: 'Failed to establish connection after multiple attempts. Please try again later.' });
        }
    };

    const initializeVenom = () => {
        venom.create(
            sessionName,
            async (base64Qr, asciiQR, attempts, urlCode) => {
                if (!responseSent) {
                    const base64Image = base64Qr.replace(/^data:image\/png;base64,/, '');
                    
                    await User.findOneAndUpdate(
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

                    qrScanTimer = setTimeout(() => removeInstanceAndSession(clients[userId]), 30000); 
                }
            },
            async (statusSession, session) => {
                console.log('Status Session: ', statusSession);
                console.log('Session name: ', session);

                if (statusSession === 'qrReadSuccess' || statusSession === 'successChat') {
                    if (qrScanTimer) clearTimeout(qrScanTimer);

                    await User.findOneAndUpdate(
                        { userId: userId },
                        { sessionActive: true },
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

                if (statusSession === 'qrReadFail' || statusSession === 'autocloseCalled' || statusSession === 'desconnectedMobile') {
                    removeInstanceAndSession(clients[userId]);
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
            }
        ).then((clientInstance) => {
            clients[userId] = clientInstance;
            closeClientAfterInactivity(clientInstance);

            clientInstance.onStateChange((state) => {
                console.log('State changed: ', state);
                if (state === 'CONNECTED') {
                    console.log('Client is ready!');
                    closeClientAfterInactivity(clientInstance);
                } else if (state === 'DISCONNECTED') {
                    removeInstanceAndSession(clientInstance);
                }
            });

            clientInstance.onMessage(() => {
                closeClientAfterInactivity(clientInstance);
            });
        }).catch((error) => {
            console.error('Error initializing venom-bot: ', error);
            sendResponse(500, { success: false, message: 'Failed to initialize venom-bot' });
        });
    };

    try {
        let user = await User.findOne({ userId: userId });

        if (clients[userId]) {
            return sendResponse(200, { success: true, session: true, message: 'Session already active' });
        }

        if (user && user.sessionActive) {
            return sendResponse(200, { success: true, session: true, message: 'WhatsApp already connected' });
        }

        if (user && user.base64QR && user.sessionExpiry && user.sessionExpiry > new Date()) {
            return sendResponse(200, {
                success: true,
                message: 'Existing QR Code retrieved successfully',
                qrCode: user.base64QR
            });
        }

        initializeVenom();

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

    if (!clients[userId]) {
        return res.status(400).send('Client is not initialized. Please generate QR code first.');
    }

    if (!message) {
        return res.status(400).send('Missing required fields: message');
    }
    const business = await Business.findOne({ AdminID: userId });
    if (!business) {
        return res.status(400).send('Business details not found.');
    }

    const { BusinessName, BusinessPhoneNo } = business;

    try {
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
            report = new WhatsAppReport({ userId: userId, sessionName: clients[userId].sessionName });
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



const getAllMessages = async (req, res) => {
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
module.exports = { QRcode, sending, getAllMessages, upload, getReport };
