const ProjectC = require('../../Model/Project');
const Customer = require('../../Model/Customer');
const Vendor = require('../../Model/vendorSchema');
const Task = require('../../Model/Task');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const addProjectConstruction = async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Function to safely parse JSON
    const safeJSONParse = (str) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return str;
      }
    };

    // Process all fields that might be stringified JSON
    const fieldsToProcess = [
      'clientContact', 'projectScope', 'projectLocation', 'projectTeam',
      'budget', 'timeline', 'risks', 'resources', 'qualityManagement',
      'communication', 'healthAndSafety', 'changeManagement', 'completion'
    ];

    fieldsToProcess.forEach(field => {
      if (projectData[field]) {
        projectData[field] = typeof projectData[field] === 'string'
          ? safeJSONParse(projectData[field])
          : projectData[field];
      }
    });

    // Handle dates
    const datesToProcess = ['startDate', 'estimatedCompletionDate', 'actualCompletionDate'];
    datesToProcess.forEach(dateField => {
      if (projectData[dateField]) {
        projectData[dateField] = new Date(projectData[dateField]);
      }
    });

    // Handle nested dates
    if (projectData.timeline && projectData.timeline.projectSchedule) {
      projectData.timeline.projectSchedule.startDate = new Date(projectData.timeline.projectSchedule.startDate);
      projectData.timeline.projectSchedule.endDate = new Date(projectData.timeline.projectSchedule.endDate);
    }

    if (projectData.timeline && projectData.timeline.milestones) {
      projectData.timeline.milestones = projectData.timeline.milestones.map(milestone => ({
        ...milestone,
        date: new Date(milestone.date)
      }));
    }

    // Handle arrays that might be strings
    ['projectTeam.teamMembers', 'projectTeam.subcontractors', 'projectScope.objectives', 'projectScope.deliverables', 'projectScope.exclusions']
      .forEach(path => {
        const parts = path.split('.');
        let obj = projectData;
        for (let i = 0; i < parts.length - 1; i++) {
          if (obj[parts[i]]) obj = obj[parts[i]];
        }
        const field = parts[parts.length - 1];
        if (obj[field] && typeof obj[field] === 'string') {
          obj[field] = obj[field].split(',').map(item => item.trim());
        }
      });

    const newProject = new projectC(projectData);

    // Handle file uploads (documentation)
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

    // Handle tasks
    if (projectData.tasks) {
      const tasks = typeof projectData.tasks === 'string' ? safeJSONParse(projectData.tasks) : projectData.tasks;
      for (const taskData of tasks) {
        const newTask = new Task(taskData);
        await newTask.save();
        newProject.tasks.push(newTask._id);
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


module.exports={addProjectConstruction}