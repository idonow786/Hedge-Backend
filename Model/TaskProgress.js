const mongoose = require('mongoose');

const taskProgressSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true
  },
  vendorId: {
    type: String
  },
  percentageGrowth: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true 
});

// Index for faster queries
taskProgressSchema.index({ taskId: 1, vendorId: 1 });

const TaskProgress = mongoose.model('TaskProgress', taskProgressSchema);

module.exports = TaskProgress;
