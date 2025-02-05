const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gaaptaskSchema = new Schema({
  title: {
    type: String,
  },
  description: {
    type: String
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser'
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'GaapProject',
  },
  teamId: {
    type: String,
  },
  branchId: {
    type: String,
  },
  department: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'On Hold','25 Percent','75 Percent','50 Percent'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  comments:{
    type: String,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  breakDuration: {
    type: Number,
    default: 0
  },
  isOvertime: {
    type: Boolean,
    default: false
  },
  dailyLogs: [{
    date: {
      type: Date,
      required: true
    },
    hoursWorked: {
      type: Number,
      default: 0
    },
    breaks: [{
      startTime: Date,
      endTime: Date,
      duration: Number
    }],
    notes: String
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'GaapUser',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const GaapTask = mongoose.model('GaapTask', gaaptaskSchema);

module.exports = GaapTask;
