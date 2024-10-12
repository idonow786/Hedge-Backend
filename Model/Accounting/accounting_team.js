const mongoose = require('mongoose');

const accountingTeamSchema = new mongoose.Schema({
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

const AccountingTeam = mongoose.model('AccountingTeam', accountingTeamSchema);

module.exports = AccountingTeam;
