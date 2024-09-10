const mongoose = require('mongoose');

const staffingTeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  BusinessId: { type: String,},
  parentUser: {
    userId: { type: String},
    name: { type: String, required: true },
    role: { 
      type: String, 
      default: 'Admin',
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

const StaffingTeam = mongoose.model('StaffingTeam', staffingTeamSchema);

module.exports = StaffingTeam;
