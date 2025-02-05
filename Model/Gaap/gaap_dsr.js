const mongoose = require('mongoose');

const gaapdsrSchema = new mongoose.Schema({
    user: { type: String },
    date: Date,
    officeVisits: Number,
    cardsCollected: Number,
    meetings: Number,
    proposals: Number,
    teamId:String,
    branchId: String,
});


const GaapDsr = mongoose.model('GaapDsr', gaapdsrSchema);

module.exports = GaapDsr;
