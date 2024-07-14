const venom = require('venom-bot');
const User = require('../../../Model/whatsappUser');
const Message = require('../../../Model/messageWhatsapp');
const WhatsAppReport = require('../../../Model/whatsAppReport');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

let clients = {};

const QRcode = async (req, res) => {
    const userId = req.adminId;
    const sessionName = `session-${userId}`; 

    try {
        if (clients[userId]) {
            return res.status(200).send({ session: true });
        }

        await User.findOneAndUpdate(
            { userId: userId },
            { sessionName: sessionName },
            { new: true, upsert: true }
        );

        let responseSent = false;

        venom.create(
            sessionName,
            (base64Qr, asciiQR, attempts, urlCode) => {
                if (!responseSent) {
                    const htmlContent = `
                        <html>
                        <head>
                            <title>WhatsApp QR Code</title>
                            <style>
                                body {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    height: 100vh;
                                    background-color: #f0f0f0;
                                    font-family: Arial, sans-serif;
                                }
                                #qr-container {
                                    text-align: center;
                                    background: white;
                                    padding: 20px;
                                    border-radius: 10px;
                                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                }
                                #qr-code {
                                    width: 300px;
                                    height: 300px;
                                }
                            </style>
                        </head>
                        <body>
                            <div id="qr-container">
                                <h1>Scan this QR Code to connect to WhatsApp</h1>
                                <img id="qr-code" src="${base64Qr}" alt="QR Code">
                            </div>
                        </body>
                        </html>
                    `;
                    res.send(htmlContent);
                    responseSent = true;
                }
            },
            async (statusSession, session) => {
                console.log('Status Session: ', statusSession);
                console.log('Session name: ', session);

                if ((statusSession === 'qrReadFail' || statusSession === 'autocloseCalled') && !responseSent) {
                    res.status(500).send('Failed to read QR code or session auto-closed.');
                    responseSent = true;
                }

                if (statusSession === 'successChat' && !responseSent) {
                    await User.findOneAndUpdate(
                        { userId: userId },
                        { sessionActive: true },
                        { new: true, upsert: true }
                    );

                    await WhatsAppReport.findOneAndUpdate(
                        { userId: userId },
                        { 
                            sessionName: sessionName,
                            userConnectedDate: new Date(),
                        },
                        { new: true, upsert: true }
                    );

                    res.status(200).send({ session: true });
                    responseSent = true;
                }
            },
            {
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
            }
        ).then((clientInstance) => {
            clients[userId] = clientInstance;
            clientInstance.onStateChange((state) => {
                console.log('State changed: ', state);
                if (state === 'CONNECTED') {
                    console.log('Client is ready!');
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
        console.error('Error saving user data: ', error);
        if (!res.headersSent) {
            res.status(500).send('Failed to save user data');
        }
    }
};


const sending = async (req, res) => {
    const { message, phoneNo, Name } = req.body;
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

    try {
        const file = req.file;
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let bulkMessagesCount = 0;

        for (const row of data) {
            let number = row.phone;

            if (!number) {
                continue; 
            }

            number = String(number);

            const chatId = number.includes('@c.us') ? number : `${number}@c.us`;

            try {
                await clients[userId].sendText(chatId, message);

                const newMessage = {
                    userId: req.adminId,
                    phoneNumber: number,
                    messages: [{
                        id: chatId,
                        from: phoneNo,
                        to: number,
                        author: phoneNo,
                        pushname: Name,
                        message_type: 'text',
                        status: 'sent',
                        body: message,
                        timestamp: new Date(),
                    }]
                };

                await Message.create(newMessage);
                bulkMessagesCount++;
            } catch (error) {
                console.error('Error sending message to: ', number, error);
            }
        }

        await WhatsAppReport.findOneAndUpdate(
            { userId: userId },
            { 
                $inc: { totalBulkMessages: bulkMessagesCount },
                lastMessageSentDate: new Date()
            },
            { new: true, upsert: true }
        );

        res.status(200).send('Messages sent successfully');
    } catch (error) {
        console.error('Error processing Excel file: ', error);
        res.status(500).send('Failed to process Excel file');
    }
};


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
