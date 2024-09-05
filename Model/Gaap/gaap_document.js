const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapdocumentSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject', 
  },
  documentType: {
    type: String,
  },
  filePath: [{
    type: String,
  }],
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const GaapDocument = mongoose.model('GaapDocument', gaapdocumentSchema);

module.exports = GaapDocument;
