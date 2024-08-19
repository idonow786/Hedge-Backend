const GaapTask = require('../../../../Model/Gaap/gaap_task');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
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
      const user=await GaapUser.findById(req.adminId)

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
        teamId:user.teamId,
        dueDate,
        createdBy: req.adminId 
      });

      const savedTask = await newTask.save({ session });

      project.tasks.push(savedTask._id);
      await project.save({ session });

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

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }

      const project = await GaapProject.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const tasks = await GaapTask.find({ project: projectId })
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name');

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
  },

  getTask: async (req, res) => {
    try {
      const { projectId } = req.query;


      const task = await GaapTask.find({project:projectId})
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