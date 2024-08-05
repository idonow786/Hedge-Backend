const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaapdepartmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',  
    required: true
  },
  employees: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  }],
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'GaapProject' 
  }],
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

const GaapDepartment = mongoose.model('GaapDepartment', gaapdepartmentSchema);

module.exports = GaapDepartment;
