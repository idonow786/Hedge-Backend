const mongoose = require('mongoose');

const gaapCommentSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GaapProject',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GaapUser',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['comment', 'instruction', 'progress_update'],
        required: true
    },
    attachments: [{
        name: String,
        url: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

gaapCommentSchema.index({ project: 1, createdAt: -1 });

const GaapComment = mongoose.model('GaapComment', gaapCommentSchema);

module.exports = GaapComment;
