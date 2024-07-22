const ProjectC = require('../../Model/Project');
const Customer = require('../../Model/Customer');
const Vendor = require('../../Model/vendorSchema');
const Task = require('../../Model/Task');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const updateProjectContruction = async (req, res) => {
  try {
    const { projectId, CustomerId } = req.body;
    const adminId = req.adminId;
    const {
      Description,
      Title,
      StartDate,
      Deadline,
      Budget,
      ProgressUpdate,
      DynamicFields,
      documentation,
      tasks
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await ProjectC.findOne({ _id: projectId, AdminID: adminId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized' });
    }

    if (CustomerId) {
      const customer = await Customer.findById(CustomerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      project.CustomerId = CustomerId;
    }

    project.Description = Description || project.Description;
    project.Title = Title || project.Title;
    project.StartDate = StartDate || project.StartDate;
    project.Deadline = Deadline || project.Deadline;
    project.Budget = Budget || project.Budget;
    project.ProgressUpdate = ProgressUpdate || project.ProgressUpdate;

    if (DynamicFields) {
      project.DynamicFields = DynamicFields;
    }

    // Handle documentation updates
    if (documentation) {
      for (const docType in documentation) {
        if (Array.isArray(documentation[docType])) {
          const uploadedUrls = await Promise.all(
            documentation[docType].map(async (doc) => {
              if (doc.buffer) {
                const fileBuffer = Buffer.from(doc.buffer, 'base64');
                return await uploadFileToFirebase(fileBuffer, doc.originalname);
              }
              return doc;
            })
          );
          project.documentation[docType] = uploadedUrls;
        }
      }
    }

    // Handle tasks updates
    if (tasks && Array.isArray(tasks)) {
      for (const taskData of tasks) {
        let task;
        if (taskData._id) {
          // Update existing task
          task = await Task.findById(taskData._id);
          if (!task) {
            return res.status(404).json({ message: `Task with ID ${taskData._id} not found` });
          }
          Object.assign(task, taskData);
        } else {
          // Create new task
          task = new Task(taskData);
        }

        if (taskData.assignedTo && taskData.assignedTo !== 'self') {
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

          task.assignedTo = assignee._id;

          if (assignee instanceof Vendor) {
            if (!assignee.assignedTasks) assignee.assignedTasks = [];
            if (!assignee.assignedTasks.includes(task._id)) {
              assignee.assignedTasks.push(task._id);
            }
            if (!assignee.projects) assignee.projects = [];
            if (!assignee.projects.includes(project._id)) {
              assignee.projects.push(project._id);
            }
            await assignee.save();

            if (!project.projectTeam.subcontractors) project.projectTeam.subcontractors = [];
            if (!project.projectTeam.subcontractors.includes(assignee._id)) {
              project.projectTeam.subcontractors.push(assignee._id);
            }
          }
        } else {
          task.assignedTo = null;
        }

        await task.save();
        if (!project.tasks.includes(task._id)) {
          project.tasks.push(task._id);
        }
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

module.exports = { updateProjectContruction };
