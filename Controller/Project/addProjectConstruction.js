const projectC = require('../../Model/projectConstruction');
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

    // Handle budget
    if (projectData.budget) {
      projectData.budget = {
        ...projectData.budget,
        costBreakdown: typeof projectData.budget.costBreakdown === 'string'
          ? safeJSONParse(projectData.budget.costBreakdown)
          : projectData.budget.costBreakdown
      };
    }

    const fieldsToProcess = ['healthAndSafety', 'communication', 'qualityManagement', 'projectScope', 'projectLocation', 'resources', 'risks'];
    fieldsToProcess.forEach(field => {
      if (projectData[field]) {
        projectData[field] = typeof projectData[field] === 'string'
          ? safeJSONParse(projectData[field])
          : projectData[field];
      }
    });

    if (projectData.communication && projectData.communication.stakeholders) {
      projectData.communication.stakeholders = typeof projectData.communication.stakeholders === 'string'
        ? safeJSONParse(projectData.communication.stakeholders)
        : projectData.communication.stakeholders;
    }

    const newProject = new projectC(projectData);

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

    // Handle tasks (if any)
    if (projectData.tasks) {
      const tasks = typeof projectData.tasks === 'string' ? safeJSONParse(projectData.tasks) : projectData.tasks;
      for (const taskData of tasks) {
        const newTask = new Task(taskData);

        if (!taskData.assignedTo || taskData.assignedTo === 'self') {
          newTask.assignedTo = null;
        } else {
          let assignee;
          if (typeof taskData.assignedTo === 'object') {
            assignee = await Vendor.findOneAndUpdate(
              { email: taskData.assignedTo.email },
              taskData.assignedTo,
              { upsert: true, new: true }
            );
          } else {
            assignee = await Vendor.findById(taskData.assignedTo);
          }

          if (!assignee) {
            return res.status(400).json({ message: `Assignee with ID ${taskData.assignedTo} not found` });
          }

          newTask.assignedTo = assignee._id;

          if (assignee instanceof Vendor) {
            if (!assignee.assignedTasks) assignee.assignedTasks = [];
            assignee.assignedTasks.push(newTask._id);
            if (!assignee.projects) assignee.projects = [];
            if (!assignee.projects.includes(newProject._id)) {
              assignee.projects.push(newProject._id);
            }
            await assignee.save();

            if (!newProject.projectTeam.subcontractors) newProject.projectTeam.subcontractors = [];
            if (!newProject.projectTeam.subcontractors.includes(assignee._id)) {
              newProject.projectTeam.subcontractors.push(assignee._id);
            }
          }
        }

        await newTask.save();
        newProject.tasks.push(newTask._id);
      }
    }

    if (!newProject.projectTeam.teamMembers) newProject.projectTeam.teamMembers = [];
    if (!newProject.projectTeam.teamMembers.includes(req.adminId)) {
      newProject.projectTeam.teamMembers.push(req.adminId);
    }
    newProject.adminId=req.adminId
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