const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for tracking detailed work logs
const gaapLogSheetSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'GaapUser',
        required: true
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'GaapTask',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    timeSpent: {
        type: Number, // in minutes
        default: 0
    },
    overtime: {
        type: Boolean,
        default: false
    },
    breakTime: {
        type: Number, // in minutes
        default: 0
    },
    workType: {
        type: String,
        enum: ['Regular', 'Overtime'],
        default: 'Regular'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    notes: {
        type: String
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'GaapUser'
    },
    approvalDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for faster queries
gaapLogSheetSchema.index({ userId: 1, date: 1 });
gaapLogSheetSchema.index({ taskId: 1 });
gaapLogSheetSchema.index({ startTime: 1, endTime: 1 });

const GaapLogSheet = mongoose.model('GaapLogSheet', gaapLogSheetSchema);

module.exports = GaapLogSheet; 