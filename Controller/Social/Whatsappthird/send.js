const venom = require('venom-bot');
const User = require('../../../Model/whatsappUser');
const Message = require('../../../Model/messageWhatsapp');
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

    try {
        // Check if client exists and is properly initialized
        if (clients[userId]) {
            try {
                const isConnected = await isClientConnected(clients[userId]);
                if (isConnected) {
                    console.log('Client is already connected');
                    return res.status(200).send({ session: true });
                } else {
                    console.log('Client exists but is not connected. Reinitializing...');
                    delete clients[userId];
                }
            } catch (error) {
                console.error('Error checking client connection:', error);
                delete clients[userId];
            }
        }

        // At this point, we know we need to generate a new QR code
        console.log('Generating new QR code for user:', userId);

        await User.findOneAndUpdate(
            { userId: userId },
            { sessionName: sessionName, sessionActive: false },
            { new: true, upsert: true }
        );

        let responseSent = false;

        const venomOptions = {
            headless: 'new',
            devtools: false,
            useChrome: true,
            browserArgs: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            disableSpins: true,
            disableWelcome: true,
            logQR: true,
            autoClose: 300000,
            createPathFileToken: false, 
            waitForLogin: false,
        };

        venom.create(
            sessionName,
            (base64Qr, asciiQR, attempts, urlCode) => {
                if (!responseSent) {
                    console.log('QR code generated. Sending to client...');
                    const qrImageData = base64Qr.replace(/^data:image\/png;base64,/, "");
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': Buffer.from(qrImageData, 'base64').length
                    });
                    res.end(Buffer.from(qrImageData, 'base64'));
                    responseSent = true;
                }
            },
            async (statusSession, session) => {
                console.log('Status Session: ', statusSession);
                console.log('Session name: ', session);

                if (statusSession === 'qrReadSuccess') {
                    console.log('QR Code scanned successfully');
                }

                if (statusSession === 'successChat') {
                    console.log('Chat connected successfully');
                    await User.findOneAndUpdate(
                        { userId: userId },
                        { sessionActive: true },
                        { new: true }
                    );

                    await WhatsAppReport.findOneAndUpdate(
                        { userId: userId },
                        { 
                            sessionName: sessionName,
                            userConnectedDate: new Date(),
                        },
                        { new: true, upsert: true }
                    );
                }

                if (statusSession === 'browserClose' || statusSession === 'qrReadFail' || statusSession === 'autocloseCalled') {
                    console.log('Session ended or failed:', statusSession);
                    await User.findOneAndUpdate(
                        { userId: userId },
                        { sessionActive: false },
                        { new: true }
                    );
                    if (clients[userId]) {
                        delete clients[userId];
                    }
                }
            },
            venomOptions
        ).then((clientInstance) => {
            console.log('Venom client created successfully');
            clients[userId] = clientInstance;
            clientInstance.onStateChange((state) => {
                console.log('State changed: ', state);
                if (state === 'CONNECTED') {
                    console.log('Client is ready!');
                }
                if (state === 'DISCONNECTED') {
                    console.log('Client disconnected');
                    User.findOneAndUpdate(
                        { userId: userId },
                        { sessionActive: false },
                        { new: true }
                    ).then(() => {
                        delete clients[userId];
                    });
                }
            });
        }).catch((error) => {
            console.error('Error initializing venom-bot: ', error);
            if (!responseSent) {
                res.status(500).send('Failed to initialize venom-bot');
                responseSent = true;
            }
        });

    } catch (error) {
        console.error('Error in QRcode function: ', error);
        if (!res.headersSent) {
            res.status(500).send('Internal server error');
        }
    }
};

async function isClientConnected(client) {
    try {
        const batteryLevel = await client.getBatteryLevel();
        console.log('Battery level:', batteryLevel);
        return true;
    } catch (error) {
        console.error('Error checking client connection:', error);
        return false;
    }
}


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

    if (!message || !phoneNo || !Name) {
        return res.status(400).send('Missing required fields: message, phoneNo, and/or Name');
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

        const week = getWeekNumber(new Date());
        const month = new Date().getMonth() + 1;

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
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
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
module.exports = { QRcode, sending, getAllMessages, upload,getReport };
