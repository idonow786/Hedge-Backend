const ProjectC = require('../../Model/Project');
const Customer = require('../../Model/Customer');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const updateProjectConstruction = async (req, res) => {
  try {
    const { projectId } = req.params;
    const adminId = req.adminId;
    const projectData = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await ProjectC.findOne({ _id: projectId, adminId: adminId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized' });
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

    // Update top-level fields
    ['projectName', 'projectDescription', 'clientId'].forEach(field => {
      if (projectData[field] !== undefined) {
        project[field] = projectData[field];
      }
    });

    // Handle dates
    ['startDate', 'estimatedCompletionDate'].forEach(field => {
      if (projectData[field]) {
        project[field] = parseDate(projectData[field]);
      }
    });

    // Handle nested objects
    ['projectLocation', 'budget', 'projectScope', 'projectTeam', 'timeline', 'communication'].forEach(field => {
      if (projectData[field]) {
        project[field] = { ...project[field], ...projectData[field] };
      }
    });

    // Handle arrays
    ['risks', 'resources'].forEach(field => {
      if (projectData[field]) {
        project[field] = safeParseOrSplit(projectData[field]);
      }
    });

    // Handle special cases
    if (projectData.budget) {
      project.budget.estimatedBudget = Number(projectData.budget.estimatedBudget);
      if (projectData.budget.costBreakdown) {
        Object.entries(projectData.budget.costBreakdown).forEach(([key, value]) => {
          project.budget.costBreakdown[key] = Number(value);
        });
      }
    }

    if (projectData.projectScope) {
      ['objectives', 'deliverables', 'exclusions'].forEach(field => {
        if (projectData.projectScope[field]) {
          project.projectScope[field] = safeParseOrSplit(projectData.projectScope[field]);
        }
      });
    }

    if (projectData.projectTeam) {
      ['teamMembers', 'subcontractors'].forEach(field => {
        if (projectData.projectTeam[field]) {
          project.projectTeam[field] = safeParseOrSplit(projectData.projectTeam[field]);
        }
      });
    }

    if (projectData.timeline) {
      if (projectData.timeline.projectSchedule) {
        project.timeline.projectSchedule.startDate = parseDate(projectData.timeline.projectSchedule.startDate);
        project.timeline.projectSchedule.endDate = parseDate(projectData.timeline.projectSchedule.endDate);
      }
      if (projectData.timeline.milestones) {
        project.timeline.milestones = safeParseOrSplit(projectData.timeline.milestones).map(milestone => ({
          ...milestone,
          date: parseDate(milestone.date)
        }));
      }
    }

    // Handle file uploads (if any)
    if (req.files) {
      project.documentation = project.documentation || {};
      for (const [fieldName, files] of Object.entries(req.files)) {
        const docType = fieldName.split('[')[1].split(']')[0];
        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const url = await uploadFileToFirebase(file.buffer, file.originalname);
            return url;
          })
        );
        project.documentation[docType] = (project.documentation[docType] || []).concat(uploadedUrls);
      }
    }

    const updatedProject = await project.save();

    res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', details: error.message });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { updateProjectConstruction };
