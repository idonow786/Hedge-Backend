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
const fs = require('fs').promises;

const upload = multer({ dest: 'uploads/' });

let clients = {};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const whatsappController = {
    processAndSendMessages: async (req, res) => {
        const userId = req.adminId;
        const sessionName = `session-${userId}`;
        let qrScanTimer;
        let responseSent = false;

        const sendResponse = (status, data) => {
            if (!responseSent) {
                res.status(status).json(data);
                responseSent = true;
            }
        };

        const removeInstanceAndSession = async () => {
            console.log(`Removing instance and session for ${userId}`);
            if (clients[userId]) {
                if (typeof clients[userId].close === 'function') {
                    await clients[userId].close();
                }
                delete clients[userId];
            }
            
            await WhatsAppSession.findOneAndUpdate(
                { userId: userId },
                { isActive: false, $unset: { base64QR: "", sessionExpiry: "" } }
            );

            const sessionPath = path.join(__dirname, '..', '..', '..', 'tokens', sessionName);
            try {
                await fs.rmdir(sessionPath, { recursive: true });
            } catch (error) {
                console.error(`Failed to remove session directory: ${error}`);
            }
        };

        try {
            if (!req.file || !req.file.path) {
                return sendResponse(400, { success: false, message: 'Missing Excel file' });
            }

            const { message, contentType } = req.body;
            if (!message) {
                return sendResponse(400, { success: false, message: 'Missing required field: message' });
            }

            await removeInstanceAndSession(); 

            clients[userId] = await venom.create(
                sessionName,
                async (base64Qr, asciiQR, attempts, urlCode) => {
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
                        message: 'QR Code generated successfully. Please scan to proceed.',
                        qrCode: base64Image
                    });

                    qrScanTimer = setTimeout(() => {
                        if (!responseSent) {
                            sendResponse(408, { success: false, message: 'QR Code expired. Please try again.' });
                        }
                        removeInstanceAndSession();
                    }, 300000); // Increased to 5 minutes
                },
                async (statusSession, session) => {
                    console.log('Status Session: ', statusSession);
                    if (statusSession === 'qrReadSuccess') {
                        clearTimeout(qrScanTimer);
                        console.log('QR Code scanned successfully');
                    } else if (statusSession === 'successChat') {
                        clearTimeout(qrScanTimer);
                        
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

                        try {
                            const result = await sendMessages(req, userId, clients[userId]);
                            sendResponse(200, { 
                                success: true, 
                                message: 'Messages sent successfully', 
                                sentCount: result.bulkMessagesCount,
                                dailyTotal: result.dailyTotal
                            });
                        } catch (error) {
                            sendResponse(500, { success: false, message: error.message });
                        } finally {
                            await removeInstanceAndSession();
                        }
                    }

                    if (['qrReadFail', 'autocloseCalled', 'desconnectedMobile', 'erroPageWhatsapp'].includes(statusSession)) {
                        sendResponse(400, { success: false, message: 'Failed to establish WhatsApp connection. Please try again.' });
                        await removeInstanceAndSession();
                    }
                },
                {
                    headless: 'new',
                    devtools: false,
                    useChrome: true,
                    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
                    disableSpins: true,
                    disableWelcome: true,
                    logQR: true,
                    autoClose: 300000, // Increased to 5 minutes
                    createPathFileToken: true,
                    waitForLogin: true,
                }
            );

            clients[userId].onStateChange((state) => {
                console.log('State changed: ', state);
                if (state === 'DISCONNECTED') {
                    removeInstanceAndSession();
                }
            });

        } catch (error) {
            console.error('Error in processAndSendMessages: ', error);
            sendResponse(500, { success: false, message: 'Internal server error' });
            await removeInstanceAndSession();
        }
    }
};

async function sendMessages(req, userId, client) {
    const { message, contentType } = req.body;
    const file = req.file;

    try {
        const business = await Business.findOne({ AdminID: userId });
        if (!business) {
            throw new Error('Business details not found.');
        }

        const { BusinessName, BusinessPhoneNo } = business;

        let imageUrl = null;
        if (req.body.base64Image && contentType) {
            imageUrl = await uploadImageToFirebase(req.body.base64Image, contentType);
        }

        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let bulkMessagesCount = 0;
        const today = new Date().toISOString().split('T')[0];

        let report = await WhatsAppReport.findOne({ userId: userId });
        if (!report) {
            report = new WhatsAppReport({ userId: userId, sessionName: `session-${userId}` });
        }

        if (report.dailyMessages.get(today) && report.dailyMessages.get(today) >= 400) {
            throw new Error('Daily message limit of 400 reached.');
        }

        for (const row of data) {
            let number = row.phone;
            if (!number) continue;

            number = String(number);
            const chatId = number.includes('@c.us') ? number : `${number}@c.us`;

            try {
                if (imageUrl) {
                    await client.sendImage(chatId, imageUrl, 'image', message);
                } else {
                    await client.sendText(chatId, message);
                }

                const newMessage = new Message({
                    userId: userId,
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
                });

                await newMessage.save();
                bulkMessagesCount++;

                report.dailyMessages.set(today, (report.dailyMessages.get(today) || 0) + 1);

                if (report.dailyMessages.get(today) >= 400) {
                    break;
                }

                await delay(60000); // 60-second delay between messages

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

        return {
            bulkMessagesCount,
            dailyTotal: report.dailyMessages.get(today) || 0
        };

    } catch (error) {
        console.error('Error in sendMessages: ', error);
        throw error;
    }
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

module.exports = whatsappController;



// const venom = require('venom-bot');
// const User = require('../../../Model/whatsappUser');
// const Message = require('../../../Model/messageWhatsapp');
// const Business = require('../../../Model/Business');
// const WhatsAppReport = require('../../../Model/whatsAppReport');
// const WhatsAppSession = require('../../../Model/WhatsappSession');
// const xlsx = require('xlsx');
// const multer = require('multer');
// const path = require('path');
// const { uploadImageToFirebase } = require('../../../Firebase/uploadImage');
// const fs = require('fs').promises;

// const upload = multer({ dest: 'uploads/' });

// let clients = {};

// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// const whatsappController = {
//     processAndSendMessages: async (req, res) => {
//         const userId = req.adminId;
//         const sessionName = `session-${userId}`;
//         let qrScanTimer;
//         let responseSent = false;

//         const sendResponse = (status, data) => {
//             if (!responseSent) {
//                 res.status(status).json(data);
//                 responseSent = true;
//             }
//         };

//         const removeInstanceAndSession = async () => {
//             console.log(`Removing instance and session for ${userId}`);
//             if (clients[userId]) {
//                 if (typeof clients[userId].close === 'function') {
//                     await clients[userId].close();
//                 }
//                 delete clients[userId];
//             }
            
//             await WhatsAppSession.findOneAndUpdate(
//                 { userId: userId },
//                 { isActive: false, $unset: { base64QR: "", sessionExpiry: "" } }
//             );

//             const sessionPath = path.join(__dirname, '..', '..', '..', 'tokens', sessionName);
//             try {
//                 await fs.rmdir(sessionPath, { recursive: true });
//             } catch (error) {
//                 console.error(`Failed to remove session directory: ${error}`);
//             }
//         };

//         try {
//             if (!req.file || !req.file.path) {
//                 return sendResponse(400, { success: false, message: 'Missing Excel file' });
//             }

//             const { message, contentType } = req.body;
//             if (!message) {
//                 return sendResponse(400, { success: false, message: 'Missing required field: message' });
//             }

//             await removeInstanceAndSession(); // Always start fresh

//             clients[userId] = await venom.create(
//                 sessionName,
//                 async (base64Qr, asciiQR, attempts, urlCode) => {
//                     if (responseSent) return;
                    
//                     const base64Image = base64Qr.replace(/^data:image\/png;base64,/, '');
                    
//                     await WhatsAppSession.findOneAndUpdate(
//                         { userId: userId },
//                         { 
//                             base64QR: base64Image,
//                             sessionExpiry: new Date(Date.now() + 5 * 60 * 1000)
//                         },
//                         { upsert: true, new: true }
//                     );

//                     sendResponse(200, {
//                         success: true,
//                         message: 'QR Code generated successfully. Please scan to proceed.',
//                         qrCode: base64Image
//                     });

//                     qrScanTimer = setTimeout(() => {
//                         if (!responseSent) {
//                             sendResponse(408, { success: false, message: 'QR Code expired. Please try again.' });
//                         }
//                         removeInstanceAndSession();
//                     }, 60000); 
//                 },
//                 async (statusSession, session) => {
//                     if (responseSent) return;
//                     console.log('Status Session: ', statusSession);
//                     if (statusSession === 'qrReadSuccess') {
//                         clearTimeout(qrScanTimer);
//                         console.log('QR Code scanned successfully');
//                     } else if (statusSession === 'successChat') {
//                         clearTimeout(qrScanTimer);
                        
//                         await WhatsAppSession.findOneAndUpdate(
//                             { userId: userId },
//                             { isActive: true },
//                             { upsert: true }
//                         );

//                         await WhatsAppReport.findOneAndUpdate(
//                             { userId: userId },
//                             {
//                                 sessionName: sessionName,
//                                 userConnectedDate: new Date(),
//                             },
//                             { new: true, upsert: true }
//                         );

//                         try {
//                             const result = await sendMessages(req, userId, clients[userId]);
//                             sendResponse(200, { 
//                                 success: true, 
//                                 message: 'Messages sent successfully', 
//                                 sentCount: result.bulkMessagesCount,
//                                 dailyTotal: result.dailyTotal
//                             });
//                         } catch (error) {
//                             sendResponse(500, { success: false, message: error.message });
//                         } finally {
//                             await removeInstanceAndSession();
//                         }
//                     }

//                     if (['qrReadFail', 'autocloseCalled', 'desconnectedMobile', 'erroPageWhatsapp'].includes(statusSession)) {
//                         sendResponse(400, { success: false, message: 'Failed to establish WhatsApp connection. Please try again.' });
//                         await removeInstanceAndSession();
//                     }
//                 },
//                 {
//                     headless: 'new',
//                     devtools: false,
//                     useChrome: true,
//                     browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
//                     disableSpins: true,
//                     disableWelcome: true,
//                     logQR: true,
//                     autoClose: 60000,
//                     createPathFileToken: true,
//                     waitForLogin: true,
//                 }
//             );

//             clients[userId].onStateChange((state) => {
//                 console.log('State changed: ', state);
//                 if (state === 'DISCONNECTED') {
//                     removeInstanceAndSession();
//                 }
//             });

//         } catch (error) {
//             console.error('Error in processAndSendMessages: ', error);
//             sendResponse(500, { success: false, message: 'Internal server error' });
//             await removeInstanceAndSession();
//         }
//     }
// };

// async function sendMessages(req, userId, client) {
//     const { message, contentType } = req.body;
//     const file = req.file;

//     try {
//         const business = await Business.findOne({ AdminID: userId });
//         if (!business) {
//             throw new Error('Business details not found.');
//         }

//         const { BusinessName, BusinessPhoneNo } = business;

//         let imageUrl = null;
//         if (req.body.base64Image && contentType) {
//             // Handle image upload logic here
//             // For example:
//             // imageUrl = await uploadImageToFirebase(req.body.base64Image, contentType);
//         }

//         const workbook = xlsx.readFile(file.path);
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const data = xlsx.utils.sheet_to_json(worksheet);

//         let bulkMessagesCount = 0;
//         const dailyLimit = 100; // Adjust as needed

//         for (const row of data) {
//             if (bulkMessagesCount >= dailyLimit) {
//                 console.log(`Daily limit of ${dailyLimit} messages reached.`);
//                 break;
//             }

//             const phoneNumber = row.PhoneNumber ? row.PhoneNumber.toString() : null;
//             if (!phoneNumber) {
//                 console.log('Skipping row due to missing phone number');
//                 continue;
//             }

//             try {
//                 if (imageUrl) {
//                     await client.sendImage(
//                         phoneNumber + '@c.us',
//                         imageUrl,
//                         'image',
//                         message
//                     );
//                 } else {
//                     await client.sendText(phoneNumber + '@c.us', message);
//                 }

//                 bulkMessagesCount++;
//                 await delay(1000); // Delay to avoid rate limiting

//                 // Save message details
//                 await new Message({
//                     userId,
//                     phoneNumber,
//                     message,
//                     status: 'sent',
//                     timestamp: new Date()
//                 }).save();

//             } catch (error) {
//                 console.error(`Failed to send message to ${phoneNumber}: ${error.message}`);
//                 await new Message({
//                     userId,
//                     phoneNumber,
//                     message,
//                     status: 'failed',
//                     timestamp: new Date()
//                 }).save();
//             }
//         }

//         // Update daily total in WhatsAppReport
//         const report = await WhatsAppReport.findOneAndUpdate(
//             { userId: userId },
//             { $inc: { dailyTotal: bulkMessagesCount } },
//             { new: true, upsert: true }
//         );

//         return { bulkMessagesCount, dailyTotal: report.dailyTotal };

//     } catch (error) {
//         console.error('Error in sendMessages:', error);
//         throw error;
//     } finally {
//         // Clean up temporary file
//         if (file && file.path) {
//             await fs.unlink(file.path).catch(console.error);
//         }
//     }
// }

// module.exports = whatsappController;
