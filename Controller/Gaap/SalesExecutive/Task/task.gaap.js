const GaapTask = require('../../../../Model/Gaap/gaap_task');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapNotification = require('../../../../Model/Gaap/gaap_notification');
const mongoose = require('mongoose');

const taskController = {
  createTask: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { projectId, title, description, assignedTo, status, priority, dueDate } = req.body;

      if (!projectId || !title) {
        return res.status(400).json({ message: 'Project ID and task title are required' });
      }
      const user = await GaapUser.findById(req.adminId);

      const project = await GaapProject.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const newTask = new GaapTask({
        title,
        description,
        assignedTo,
        project: projectId,
        teamId: project.teamId,
        status,
        priority,
        teamId: user.teamId,
        dueDate,
        createdBy: req.adminId
      });

      const savedTask = await newTask.save({ session });
      project.status = 'In Progress';
      project.tasks.push(savedTask._id);
      await project.save({ session });

      // Create a notification for the project creator
      const notification = new GaapNotification({
        user: project.createdBy,
        message: `A new task "${title}" has been added to project "${project.projectName}"`,
      });
      await notification.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json(savedTask);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({ message: 'Error creating task', error: error.message });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { taskId } = req.query;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }

      const task = await GaapTask.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      if (updateData.status === 'Completed' && task.status !== 'Completed') {
        updateData.completedDate = new Date();
      }

      const updatedTask = await GaapTask.findByIdAndUpdate(taskId, updateData, { new: true });
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: 'Error updating task', error: error.message });
    }
  },

  deleteTask: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { taskId } = req.query;

      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID' });
      }

      const task = await GaapTask.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      await GaapTask.findByIdAndDelete(taskId, { session });

      await GaapProject.findByIdAndUpdate(task.project,
        { $pull: { tasks: taskId } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
  },

  getProjectTasks: async (req, res) => {
    try {
      const { projectId } = req.query;
      const adminId = req.adminId;
      const userRole = req.role;
  
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
  
      const project = await GaapProject.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      const checkTask=await GaapTask.find()

      const user = await GaapUser.findById(adminId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      let tasksQuery = { project: projectId };
  
      if (['admin', 'Operation Manager', 'Sales Executive', 'Sales Manager'].includes(userRole)) {
        tasksQuery.teamId = user.teamId;
      } else if (['Audit Manager', 'Accounting Manager', 'Tax Supervisor', 'ICV Manager'].includes(userRole)) {
        tasksQuery.teamId = user.teamId;
        tasksQuery.$or = [
          { createdBy: adminId },
          { assignedTo: adminId }
        ];
      } else {
        tasksQuery.$or = [
          { createdBy: adminId },
          { assignedTo: adminId }
        ];
      }
  
      let tasks = await GaapTask.find(tasksQuery)
        .populate('assignedTo', 'fullName')
        .populate('createdBy', 'fullName');
  
      // If the user is a manager, filter tasks based on department in the application
      if (['Audit Manager', 'Accounting Manager', 'Tax Supervisor', 'ICV Manager'].includes(userRole)) {
        const isDepartmentIncluded = (taskDepartment, userDepartment) => {
          const taskDepts = taskDepartment.split('+').map(dept => dept.trim().toLowerCase());
          return taskDepts.includes(userDepartment.toLowerCase());
        };
  
        tasks = tasks.filter(task => 
          isDepartmentIncluded(task.department, user.department) ||
          task.createdBy._id.toString() === adminId ||
          (task.assignedTo && task.assignedTo._id.toString() === adminId)
        );
      }
  
      res.json(checkTask);
    } catch (error) {
      console.error('Error in getProjectTasks:', error);
      res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
  },

  getTask: async (req, res) => {
    try {
      const { projectId } = req.query;


      const task = await GaapTask.find({ project: projectId })
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .populate('project', 'projectName');

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching task', error: error.message });
    }
  }
};

module.exports = taskController;