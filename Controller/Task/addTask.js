
const Task = require('../../Model/Task');
const TaskProgress = require('../../Model/TaskProgress');
const Vendor = require('../../Model/vendorSchema');

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
      initialPercentage,
      projectId
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
      dependencies,
      projectId
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

    if (vendorId) {
      const vendor = await Vendor.findById(vendorId);
      console.log(vendor)
      if (vendor) {
        vendor.tasksId.push(savedTask._id.toString());
        await vendor.save();
        console.log(vendor)
      } else {
        console.warn(`Vendor with ID ${vendorId} not found.`);
      }
    }

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





const updateTask = async (req, res) => {
  try {
    const { taskId, projectId, vendorId } = req.body;
    const updateData = req.body;

    const task = await Task.findOne({ _id: taskId, projectId: projectId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or does not belong to the specified project' });
    }

    const allowedTaskFields = ['name', 'description', 'assignedTo', 'priorityLevel', 'startDate', 'endDate', 'estimatedHours', 'actualHours', 'status', 'dependencies'];
    allowedTaskFields.forEach(field => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    if (vendorId && vendorId !== task.vendorId) {
      if (task.vendorId) {
        await Vendor.findByIdAndUpdate(task.vendorId, {
          $pull: { tasksId: task._id.toString() }
        });
      }

      await Vendor.findByIdAndUpdate(vendorId, {
        $addToSet: { tasksId: task._id.toString() }
      });

      task.vendorId = vendorId;
    }

    const updatedTask = await task.save();

    if (updateData.percentageGrowth !== undefined || updateData.progressDescription) {
      let taskProgress = await TaskProgress.findOne({ taskId: task._id });

      if (!taskProgress) {
        taskProgress = new TaskProgress({
          taskId: task._id,
          percentageGrowth: 0,
          description: ''
        });
      }

      if (updateData.percentageGrowth !== undefined) {
        taskProgress.percentageGrowth = updateData.percentageGrowth;
      }
      if (updateData.progressDescription) {
        taskProgress.description = updateData.progressDescription;
      }
      taskProgress.lastUpdated = new Date();

      await taskProgress.save();

      if (!task.TaskProgressId) {
        task.TaskProgressId = taskProgress._id;
        await task.save();
      }
    }

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};








const getTaskWithProgress = async (req, res) => {
  try {
    const { projectId } = req.query;
    console.log(projectId)
    console.log(await Task.find())
    const tasks = await Task.find({ projectId });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found for this project' });
    }

    const taskIds = tasks.map(task => task._id);

    const taskProgresses = await TaskProgress.find({ taskId: { $in: taskIds } });

    const progressMap = taskProgresses.reduce((map, progress) => {
      map[progress.taskId.toString()] = progress;
      return map;
    }, {});

    const tasksWithProgress = tasks.map(task => {
      const taskObject = task.toObject();
      const progress = progressMap[task._id.toString()];
      return {
        ...taskObject,
        progress: progress ? progress.toObject() : null
      };
    });

    res.status(200).json({
      message: 'Tasks and progress retrieved successfully',
      data: tasksWithProgress
    });

  } catch (error) {
    console.error('Error retrieving tasks and progress:', error);
    res.status(500).json({ message: 'Error retrieving tasks and progress', error: error.message });
  }
};


const deleteTask=async (req, res) => {
  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).json({ message: 'taskId is required in the request body' });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(taskId);

    await TaskProgress.deleteMany({ taskId: taskId });

    res.status(200).json({ message: 'Task and associated progress records deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'An error occurred while deleting the task', error: error.message });
  }
};

module.exports = { updateTask,addTask,getTaskWithProgress,deleteTask };
