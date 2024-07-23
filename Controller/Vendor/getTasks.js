const Vendor = require('../../Model/vendorSchema');
const Task = require('../../Model/Task');
const TaskProgress = require('../../Model/TaskProgress');

const getVendorTasksInfo = async (req, res) => {
  try {
    const  adminId  = req.adminId;
    console.log(await Vendor.find())
    const vendor = await Vendor.find({_id:adminId});
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const tasks = await Task.find({ _id: { $in: vendor.tasksId } });

    const taskProgressList = await TaskProgress.find({ 
      taskId: { $in: vendor.tasksId },
      vendorId: vendor._id
    });

    const taskProgressMap = taskProgressList.reduce((map, progress) => {
      map[progress.taskId.toString()] = progress;
      return map;
    }, {});

    const response = {
      vendor: {
        name: vendor.name,
        email: vendor.contactInformation?.email,
        phone: vendor.contactInformation?.phone,
        companyName: vendor.contactInformation?.companyname
      },
      tasks: tasks.map(task => ({
        id: task._id,
        name: task.name,
        description: task.description,
        priorityLevel: task.priorityLevel,
        startDate: task.startDate,
        endDate: task.endDate,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        status: task.status,
        progress: taskProgressMap[task._id.toString()] ? {
          percentageGrowth: taskProgressMap[task._id.toString()].percentageGrowth,
          description: taskProgressMap[task._id.toString()].description,
          lastUpdated: taskProgressMap[task._id.toString()].lastUpdated
        } : null
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching vendor tasks info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {getVendorTasksInfo};
