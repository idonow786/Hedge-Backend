const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  TaskProgressId: { type: String },
  projectId: { type: String },
  description: String,
  assignedTo: { type: String },
  priorityLevel: String,
  startDate: Date,
  endDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

module.exports = mongoose.model('Task', taskSchema);
