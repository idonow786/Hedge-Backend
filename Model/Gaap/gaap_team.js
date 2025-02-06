const mongoose = require('mongoose');

const gaapTeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  BusinessId: { type: String,},
  parentUser: {
    userId: { type: String},
    name: { type: String, required: true },
    role: { 
      type: String, 
      default: 'admin',
      immutable: true 
    }
  },
  GeneralUser: {
    userId: { type: String},
    name: { type: String },
    role: { 
      type: String, 
      default: 'Audit Manager',
    }
  },

  members: [{
    memberId:{type:String},
    name: { type: String },
    role: {
      type: String,
    },
    department: {
      type: String,
    },
    managerId: { type:String }
  }]
});

const GaapTeam = mongoose.model('GaapTeam', gaapTeamSchema);

module.exports = GaapTeam;
