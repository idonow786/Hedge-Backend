const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  ID: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000),
  },
  Description: {
    type: String,
  },
  Title: {
    type: String,
  },
  StartDate: {
    type: String,
  },
  Deadline: {
    type: String,
  },
  AdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  CustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  BusinessID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
  },
  Budget: {
    type: String,
  },
  ProgressUpdate: {
    type: String,
  },
  DynamicFields: [
    {
      key: {
        type: String,
      },
      value: {
        type: String,
      },
    },
  ],
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;