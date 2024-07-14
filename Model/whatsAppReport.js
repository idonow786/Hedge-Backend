const mongoose = require('mongoose');

const WhatsAppReportSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    totalBulkMessages: {
        type: Number,
        default: 0
    },
    dailyMessages: {
        type: Map,
        of: Number,
        default: {}
    },
    weeklyMessages: {
        type: Map,
        of: Number,
        default: {}
    },
    monthlyMessages: {
        type: Map,
        of: Number,
        default: {}
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
