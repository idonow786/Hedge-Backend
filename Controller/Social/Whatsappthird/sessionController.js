const path = require('path');
const fs = require('fs').promises;
const WhatsAppSession = require('../../../Model/WhatsappSession');

const sessionController = {
    removeSession: async (req, res) => {
        const userId = req.adminId;
        const sessionName = `session-${userId}`;

        try {
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
                console.log(`Session directory removed: ${sessionPath}`);
            } catch (error) {
                console.error(`Failed to remove session directory: ${error}`);
            }

            res.status(200).json({ success: true, message: 'Session and instance removed successfully.' });
        } catch (error) {
            console.error('Error in removeSession: ', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
};

module.exports = sessionController;
