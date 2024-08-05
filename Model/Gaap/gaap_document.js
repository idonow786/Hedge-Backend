const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapdocumentSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject', 
    required: true
  },
  documentType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
    required: true
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
