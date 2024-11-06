const mongoose = require('mongoose');

const atisTeamSchema = new mongoose.Schema({
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

const ATISTeam = mongoose.model('ATISTeam', atisTeamSchema);

module.exports = ATISTeam;
