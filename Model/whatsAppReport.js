const mongoose = require('mongoose');

const WhatsAppReportSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    totalBulkMessages: {
        type: Number,
        default: 0
    },
    totalUsers: {
        type: Number,
        default: 0
    },
    userConnectedDate: {
        type: Date,
        default: Date.now
    },
    lastMessageSentDate: {
        type: Date
    },
    sessionName: {
        type: String,
        required: true
    }
});

const WhatsAppReport = mongoose.model('WhatsAppReport', WhatsAppReportSchema);

module.exports = WhatsAppReport;
