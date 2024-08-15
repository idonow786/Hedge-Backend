const mongoose = require('mongoose');

const gaapTeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  parentUser: {
    name: { type: String, required: true },
    role: { 
      type: String, 
      default: 'Parent User',
      immutable: true 
    }
  },
  members: [{
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['General Manager', 'Sales Executive', 'Sales Manager', 'Finance Manager', 'Department Manager', 'Operational Executive'],
      required: true
    },
    department: {
      type: String,
      enum: ['Sales', 'Finance', 'Audit', 'Tax', 'ICV', 'Operations'],
    },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'GaapTeam.members' }
  }]
});

const GaapTeam = mongoose.model('GaapTeam', gaapTeamSchema);

module.exports = GaapTeam;
