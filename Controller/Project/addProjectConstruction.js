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

    const newProject = new projectC(projectData);

    // Handle file uploads
    if (req.files) {
      newProject.documentation = {};
      for (const [fieldName, files] of Object.entries(req.files)) {
        const docType = fieldName.split('.')[1]; // Extract document type from field name
        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const url = await uploadFileToFirebase(file.buffer, file.originalname);
            return url;
          })
        );
        newProject.documentation[docType] = uploadedUrls;
      }
    }

    // Handle budget
    if (projectData.budget) {
      newProject.budget = {
        estimatedBudget: projectData.budget.estimatedBudget,
        fundingSource: projectData.budget.fundingSource,
        costBreakdown: JSON.parse(projectData.budget.costBreakdown)
      };
    }

    // Handle other nested objects
    ['healthAndSafety', 'communication', 'qualityManagement', 'projectScope', 'projectLocation'].forEach(field => {
      if (projectData[field]) {
        newProject[field] = JSON.parse(projectData[field]);
      }
    });

    // Handle arrays
    ['resources', 'risks'].forEach(field => {
      if (projectData[field]) {
        newProject[field] = JSON.parse(projectData[field]);
      }
    });

    // Handle tasks (if any)
    if (projectData.tasks) {
      const tasks = JSON.parse(projectData.tasks);
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

    // Add the admin to the project team
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
