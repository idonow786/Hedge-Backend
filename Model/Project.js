const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
 ID: {
  type: Number,
  default: () => Math.floor(Math.random() * 1000000),
},

  Title: {
    type: String,
  },
  TotalTask: {
    type: Number,
  },
  CompletedTask: {
    type: Number,
    default: 0,
  },
  HoursSpend: {
    type: Number,
    default: 0,
  },
  SpendingAmount: {
    type: Number,
    default: 0,
  },
  ProgressPercentage: {
    type: Number,
    default: 0,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  Activity: [
    {
      moduleTitle: {
        type: String,
          },
      Date: {
        type: Date,
        default: Date.now,
      },
      Status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending',
      },
    },
  ],
  AboutProject: {
    BackgroundInformation: {
      type: String,
    },
    ExistingWebsiteLink: {
      type: String,
    },
    ProjectBrief: {
      type: String,
    },
    ProjectOwner: {
      type: String,
    },
    Budget: {
      type: Number,
    },
    StartDate: {
      type: Date,
    },
    Deadline: {
      type: Date,
    },
  },
  
  TeamMembers: [
    {
      StaffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
      },
      ProjectProgressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectProgress',
      },
    },
  ],
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;