// controllers/webhookController.js

const WhatsApp = require('../../../Model/whatsapp');
const { WEBHOOK_VERIFY_TOKEN } = require('../../../Config/whatsappconfig');

const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
};

const handleWebhook = async (req, res) => {
    const body = req.body;

    if (body.object) {
        body.entry.forEach(async (entry) => {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;
            const message = webhookEvent.message;

            if (message && message.text) {
                const whatsapp = await WhatsApp.findOne({ phoneNumberId: senderId });

                if (whatsapp) {
                    whatsapp.messages.push({ sender: senderId, content: message.text });
                    await whatsapp.save();

                    console.log(`Received message from ${whatsapp.owner}: ${message.text}`);

                }
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
};

module.exports = { verifyWebhook, handleWebhook };
