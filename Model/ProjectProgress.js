const mongoose = require('mongoose');

const projectProgressSchema = new mongoose.Schema({
  StaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  StaffName: {
    type: String,
  },
  ProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  Status: {
    type: String,
    enum: ['Completed', 'In Progress', 'Failed'],
  },
  Time: {
    type: Number,
  },
  Modules: [
    {
      moduleTitle: {
        type: String,
          },
      Date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const ProjectProgress = mongoose.model('ProjectProgress', projectProgressSchema);

module.exports = ProjectProgress;