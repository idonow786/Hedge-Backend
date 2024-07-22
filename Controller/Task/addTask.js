const Task = require('../models/Task');
const TaskProgress = require('../models/TaskProgress'); 

const addTask = async (req, res) => {
  try {
    const {
      name,
      description,
      assignedTo,
      priorityLevel,
      startDate,
      endDate,
      estimatedHours,
      actualHours,
      status,
      dependencies,
      vendorId, 
      initialPercentage 
    } = req.body;

    const newTask = new Task({
      name,
      description,
      assignedTo,
      priorityLevel,
      startDate,
      endDate,
      estimatedHours,
      actualHours,
      status,
      dependencies
    });

    const savedTask = await newTask.save();

    const newTaskProgress = new TaskProgress({
      taskId: savedTask._id,
      vendorId,
      percentageGrowth: initialPercentage || 0,
      description: 'Initial task progress'
    });

    const savedTaskProgress = await newTaskProgress.save();

    savedTask.TaskProgressId = savedTaskProgress._id;
    await savedTask.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: savedTask,
      taskProgress: savedTaskProgress
    });

  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Error adding task', error: error.message });
  }
};

module.exports = { addTask };
