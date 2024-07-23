const mongoose = require('mongoose');

const projectCSchema = new mongoose.Schema({

  adminId: { type: String,  },
  projectName: { type: String, },
  clientId: { type: String},
  clientContact: {
    phoneNumber: String,
    emailAddress: String,
    address: String
  },
  startDate: Date,
  estimatedCompletionDate: Date,
  actualCompletionDate: Date,
  projectDescription: String,
  projectScope: {
    objectives: [String],
    deliverables: [String],
    scopeOfWork: String,
    exclusions: [String]
  },
  projectLocation: {
    siteAddress: String,
    city: String,
    stateProvince: String,
    postalCode: String,
    country: String
  },
  projectTeam: {
    projectManager: { type: String },
    teamMembers: [{ type: String }],
    subcontractors: [{ type: String }]
  },
  budget: {
    estimatedBudget: Number,
    actualBudget: Number,
    costBreakdown: {
      laborCosts: Number,
      materialCosts: Number,
      equipmentCosts: Number,
      subcontractorCosts: Number,
      miscellaneousCosts: Number
    },
    fundingSource: String
  },
  timeline: {
    projectSchedule: {
      startDate: Date,
      endDate: Date
    },
    milestones: [{
      name: String,
      date: Date,
      description: String
    }]
  },
  tasks: [{ type: String }],
  risks: [{
    description: String,
    probability: String,
    impact: String,
    mitigationPlan: String,
    owner: { type: String }
  }],
  resources: [{
    name: String,
    type: String,
    allocation: Number,
    availability: String,
    cost: Number
  }],
  qualityManagement: {
    qualityStandards: [String],
    qualityControlProcedures: [String],
    inspectionSchedule: [Date],
    inspectionResults: [String]
  },
  communication: {
    communicationPlan: String,
    meetingSchedule: [Date],
    meetingNotes: [String],
    stakeholders: [{
      name: String,
      role: String,
      contactInformation: String
    }]
  },
  documentation: {
    contracts: [String],
    permits: [String],
    plansAndDrawings: [String],
    reports: [String],
    correspondence: [String]
  },
  healthAndSafety: {
    safetyPlan: String,
    safetyInspections: [Date],
    incidentReports: [String],
    emergencyContacts: [String]
  },
  changeManagement: [{
    changeDescription: String,
    reasonForChange: String,
    impactOnScope: String,
    impactOnSchedule: String,
    impactOnBudget: Number,
    approved: Boolean
  }],
  completion: {
    finalInspectionReport: String,
    punchList: [String],
    handoverDocuments: [String],
    clientSignOff: Boolean
  },
  notes: [String],
  comments: [String]
});

module.exports = mongoose.model('ProjectC', projectCSchema);

