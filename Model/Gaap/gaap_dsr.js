const mongoose = require('mongoose');

const gaapdsrSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'GaapUser' },
    date: Date,
    officeVisits: Number,
    cardsCollected: Number,
    meetings: Number,
    proposals: Number
});


const GaapDsr = mongoose.model('GaapDsr', gaapdsrSchema);

module.exports = GaapDsr;
