const mongoose = require('mongoose');

const projectConstructionSchema = new mongoose.Schema({
  projectName: { type: String },
  Status: { type: String},
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  projectDescription: { type: String },
  startDate: { type: Date },
  estimatedCompletionDate: { type: Date },
  projectLocation: {
    siteAddress: { type: String},
    city: { type: String},
    stateProvince: { type: String},
    postalCode: { type: String},
    country: { type: String },
  },
  budget: {
    estimatedBudget: { type: Number },
    fundingSource: { type: String },
    costBreakdown: {
      laborCosts: { type: Number, default: 0 },
      materialCosts: { type: Number, default: 0 },
      equipmentCosts: { type: Number, default: 0 },
      subcontractorCosts: { type: Number, default: 0 },
      miscellaneousCosts: { type: Number, default: 0 },
    },
  },
  projectScope: {
    scopeOfWork: { type: String },
    objectives: [String],
    deliverables: [String],
    exclusions: [String],
  },
  projectTeam: {
    projectManager: { type: String },
    teamMembers: [String],
    subcontractors: [String],
  },
  timeline: {
    projectSchedule: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
    milestones: [{
      name: String,
      date: Date,
      description: String,
    }],
  },
  risks: [{
    riskName: String,
    description: String,
    probability: String,
    impact: String,
    mitigationStrategy: String,
  }],
  resources: [{
    resourceName: String,
    resourceType: String,
    quantity: Number,
    unitCost: Number,
  }],
  communication: {
    stakeholders: [{
      name: String,
      role: String,
      contactInfo: String,
      communicationPreference: String,
    }],
  },
  documentation: {
    contracts: [String],
    permits: [String],
    plansAndDrawings: [String],
    reports: [String],
    correspondence: [String],
    safetyReports: [String],
    qualityReports: [String],
    progressReports: [String],
    financialReports: [String],
    environmentalReports: [String],
    changeOrders: [String],
    submittals: [String],
    inspectionReports: [String],
    meetingMinutes: [String],
    photos: [String],
    warranties: [String],
    asBuiltDrawings: [String],
    operationManuals: [String],
    certifications: [String],
    insuranceDocuments: [String],
  },
  adminId: { type:String},
});

const ProjectC = mongoose.model('ProjectC', projectConstructionSchema);

module.exports = ProjectC;
