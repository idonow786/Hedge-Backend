
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
      assignedTo, // This is now a single ObjectId
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
      if (vendor) {
        vendor.tasksId.push(savedTask._id.toString());
        await vendor.save();
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
    const { taskId } = req.params;

    const task = await Task.findById(taskId)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskProgress = await TaskProgress.findOne({ taskId: task._id });

    const taskWithProgress = {
      ...task.toObject(),
      progress: taskProgress ? taskProgress.toObject() : null
    };

    res.status(200).json({
      message: 'Task and progress retrieved successfully',
      data: taskWithProgress
    });

  } catch (error) {
    console.error('Error retrieving task and progress:', error);
    res.status(500).json({ message: 'Error retrieving task and progress', error: error.message });
  }
};


module.exports = { updateTask,addTask,getTaskWithProgress };
