const ProjectC = require('../../Model/Project');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const addProjectConstruction = async (req, res) => {
  try {
    const projectData = req.body;
    console.log('Project Data: ', projectData);

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

    // Function to parse date strings
    const parseDate = (dateString) => {
      if (dateString) {
        return new Date(dateString);
      }
      return null;
    };

    // Handle top-level dates
    projectData.startDate = parseDate(projectData.startDate);
    projectData.estimatedCompletionDate = parseDate(projectData.estimatedCompletionDate);

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

    // Handle timeline
    if (projectData.timeline) {
      if (projectData.timeline.projectSchedule) {
        projectData.timeline.projectSchedule.startDate = parseDate(projectData.timeline.projectSchedule.startDate);
        projectData.timeline.projectSchedule.endDate = parseDate(projectData.timeline.projectSchedule.endDate);
      }
      if (projectData.timeline.milestones) {
        projectData.timeline.milestones = safeParseOrSplit(projectData.timeline.milestones).map(milestone => ({
          ...milestone,
          date: parseDate(milestone.date)
        }));
      }
    }

    // Handle risks
    if (projectData.risks) {
      projectData.risks = safeParseOrSplit(projectData.risks);
    }

    // Handle resources
    if (projectData.resources) {
      projectData.resources = safeParseOrSplit(projectData.resources).map(resource => ({
        ...resource,
        quantity: Number(resource.quantity),
        unitCost: Number(resource.unitCost)
      }));
    }

    // Handle communication
    if (projectData.communication && projectData.communication.stakeholders) {
      projectData.communication.stakeholders = safeParseOrSplit(projectData.communication.stakeholders);
    }

    const newProject = new ProjectC(projectData);
    
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

    await newProject.save();

    res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });
    console.log(newProject)
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
