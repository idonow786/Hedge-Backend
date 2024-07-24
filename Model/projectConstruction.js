const mongoose = require('mongoose');

const projectConstructionSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  projectDescription: { type: String, required: true },
  startDate: { type: Date, required: true },
  estimatedCompletionDate: { type: Date, required: true },
  projectLocation: {
    siteAddress: { type: String, required: true },
    city: { type: String, required: true },
    stateProvince: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  budget: {
    estimatedBudget: { type: Number, required: true },
    fundingSource: { type: String, required: true },
    costBreakdown: {
      laborCosts: { type: Number, default: 0 },
      materialCosts: { type: Number, default: 0 },
      equipmentCosts: { type: Number, default: 0 },
      subcontractorCosts: { type: Number, default: 0 },
      miscellaneousCosts: { type: Number, default: 0 },
    },
  },
  projectScope: {
    scopeOfWork: { type: String, required: true },
    objectives: [String],
    deliverables: [String],
    exclusions: [String],
  },
  projectTeam: {
    projectManager: { type: String, required: true },
    teamMembers: [String],
    subcontractors: [String],
  },
  timeline: {
    projectSchedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
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
