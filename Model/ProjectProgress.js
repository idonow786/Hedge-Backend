const mongoose = require('mongoose');

const projectProgressSchema = new mongoose.Schema({
  StaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
  },
  StaffName: {
    type: String,
    required: true,
  },
  ProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  Status: {
    type: String,
    enum: ['Completed', 'In Progress', 'Failed'],
    required: true,
  },
  Time: {
    type: Number,
    required: true,
  },
  Modules: [
    {
      moduleTitle: {
        type: String,
        required: true,
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