const projectC = require('../../Model/projectConstruction');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const addProjectConstruction = async (req, res) => {
  try {
    const projectData = req.body;
    console.log('Project Data:', projectData);

    if (!projectData.projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Function to safely parse JSON or split string
    const safeParseOrSplit = (value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value.split(',').map(item => item.trim());
        }
      }
      return value;
    };

    // Handle budget
    if (projectData.budget) {
      projectData.budget = {
        ...projectData.budget,
        estimatedBudget: Number(projectData.budget.estimatedBudget),
        costBreakdown: Object.entries(projectData.budget.costBreakdown).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {})
      };
    }

    // Handle projectScope
    if (projectData.projectScope) {
      ['objectives', 'deliverables', 'exclusions'].forEach(field => {
        if (projectData.projectScope[field]) {
          projectData.projectScope[field] = safeParseOrSplit(projectData.projectScope[field]);
        }
      });
    }

    // Handle projectTeam
    if (projectData.projectTeam) {
      ['teamMembers', 'subcontractors'].forEach(field => {
        if (projectData.projectTeam[field]) {
          projectData.projectTeam[field] = safeParseOrSplit(projectData.projectTeam[field]);
        }
      });
    }

    // Handle resources
    if (projectData.resources) {
      projectData.resources = Array.isArray(projectData.resources) 
        ? projectData.resources.map(resource => ({
            name: resource.resourceName,
            type: resource.resourceType,
            allocation: Number(resource.quantity),
            cost: Number(resource.unitCost)
          }))
        : [];
    }

    // Handle risks
    if (projectData.risks) {
      projectData.risks = Array.isArray(projectData.risks)
        ? projectData.risks.map(risk => ({
            description: risk.description,
            probability: risk.probability,
            impact: risk.impact,
            mitigationPlan: risk.mitigationStrategy,
            owner: risk.riskName
          }))
        : [];
    }

    // Handle timeline
    if (projectData.timeline && projectData.timeline.milestones) {
      projectData.timeline.milestones = Array.isArray(projectData.timeline.milestones)
        ? projectData.timeline.milestones.map(milestone => ({
            name: milestone.name,
            date: milestone.date ? new Date(milestone.date) : null,
            description: milestone.description
          }))
        : [];
    }

    // Handle communication
    if (projectData.communication && projectData.communication.stakeholders) {
      projectData.communication.stakeholders = safeParseOrSplit(projectData.communication.stakeholders);
    }

    const newProject = new projectC(projectData);

    // Handle file uploads (if any)
    if (req.files) {
      newProject.documentation = {};
      for (const [fieldName, files] of Object.entries(req.files)) {
        const docType = fieldName.split('[')[1].split(']')[0];
        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const url = await uploadFileToFirebase(file.buffer, file.originalname);
            return url;
          })
        );
        newProject.documentation[docType] = uploadedUrls;
      }
    }

    // Set adminId
    newProject.adminId = req.adminId;

    // Ensure projectTeam.teamMembers includes the admin
    if (!newProject.projectTeam.teamMembers) newProject.projectTeam.teamMembers = [];
    if (!newProject.projectTeam.teamMembers.includes(req.adminId)) {
      newProject.projectTeam.teamMembers.push(req.adminId);
    }

    await newProject.save();

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });
  } catch (error) {
    console.error('Error in addProjectConstruction:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', details: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate project name or vendor email' });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { addProjectConstruction };
