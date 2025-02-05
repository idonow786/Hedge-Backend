const GaapTask = require('../../../../Model/Gaap/gaap_task');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapNotification = require('../../../../Model/Gaap/gaap_notification');
const GaapLogSheet = require('../../../../Model/Gaap/gaap_logsheet');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);
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
        branchId: user.branchId,
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
  assignTasks: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { taskIds, userId } = req.body;

      // 1. Input Validation
      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: 'taskIds must be a non-empty array' });
      }

      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      // Validate each taskId is a valid ObjectId
      const invalidTaskIds = taskIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidTaskIds.length > 0) {
        return res.status(400).json({ message: `Invalid taskIds: ${invalidTaskIds.join(', ')}` });
      }

      // 2. Verify User Exists
      const user = await GaapUser.findById(userId).session(session);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // 3. Fetch Tasks
      const tasks = await GaapTask.find({ _id: { $in: taskIds } }).session(session);

      if (tasks.length !== taskIds.length) {
        const foundTaskIds = tasks.map(task => task._id.toString());
        const notFoundTaskIds = taskIds.filter(id => !foundTaskIds.includes(id));
        return res.status(404).json({ message: `Tasks not found: ${notFoundTaskIds.join(', ')}` });
      }

      // 4. Ensure All Tasks Belong to the Same Team
      const teamIds = [...new Set(tasks.map(task => task.teamId))];
      if (teamIds.length !== 1) {
        return res.status(400).json({ message: 'All tasks must belong to the same team' });
      }

      const teamId = teamIds[0];

      // Ensure the user belongs to the same team
      if (user.teamId !== teamId) {
        return res.status(403).json({ message: 'User does not belong to the same team as the tasks' });
      }

      // 5. Fetch Projects Associated with Tasks
      const projectIds = [...new Set(tasks.map(task => task.project))];
      const projects = await GaapProject.find({ _id: { $in: projectIds } }).session(session);

      // Map of projectId to project for quick access
      const projectMap = {};
      projects.forEach(project => {
        projectMap[project._id.toString()] = project;
      });

      // 6. Update Tasks
      const updateTasksPromises = tasks.map(task => {
        const originalStatus = task.status;
        let newStatus = task.status;

        // If task was previously unassigned or in a status that indicates not started, set to 'In Progress'
        if (!task.assignedTo || ['Pending', 'On Hold', '25 Percent', '50 Percent'].includes(task.status)) {
          newStatus = 'In Progress';
        }

        return GaapTask.updateOne(
          { _id: task._id },
          {
            assignedTo: userId,
            status: newStatus,
            updatedAt: new Date()
          },
          { session }
        );
      });

      await Promise.all(updateTasksPromises);

      // 7. Update Associated Projects' Status if Necessary
      // If any task's status was updated to 'In Progress', set the project's status to 'In Progress'
      const projectsToUpdate = new Set();

      tasks.forEach(task => {
        if (['In Progress'].includes(task.status)) {
          projectsToUpdate.add(task.project.toString());
        }
      });

      const updateProjectsPromises = Array.from(projectsToUpdate).map(projectId => {
        return GaapProject.updateOne(
          { _id: projectId },
          { status: 'In Progress', updatedAt: new Date() },
          { session }
        );
      });

      await Promise.all(updateProjectsPromises);

      // 8. Create Notifications for the Assigned User
      const notifications = tasks.map(task => ({
        user: userId,
        message: `You have been assigned to the task "${task.title}" in project "${projectMap[task.project.toString()].projectName}".`,
        createdAt: new Date()
      }));

      if (notifications.length > 0) {
        await GaapNotification.insertMany(notifications, { session });
      }

      // 9. Commit Transaction
      await session.commitTransaction();
      session.endSession();

      // 10. Fetch Updated Tasks to Return
      const updatedTasks = await GaapTask.find({ _id: { $in: taskIds } }).populate('assignedTo', 'name email');

      res.status(200).json({
        message: 'Tasks successfully assigned',
        tasks: updatedTasks
      });
    } catch (error) {
      // Abort Transaction in Case of Error
      await session.abortTransaction();
      session.endSession();

      console.error('Error assigning tasks:', error);
      res.status(500).json({ message: 'Error assigning tasks', error: error.message });
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
  
      // Check if all tasks for the same project are completed
      const allProjectTasks = await GaapTask.find({ project: updatedTask.project });
      const allTasksCompleted = allProjectTasks.every(task => task.status === 'Completed');
  
      if (allTasksCompleted) {
        // Update project status
        const project = await GaapProject.findById(updatedTask.project);
  
        if (project) {
          // Find the Finance Manager using teamId
          const financeManager = await GaapUser.findOne({ teamId: updatedTask.teamId, role: 'Finance Manager' });
          if (financeManager && financeManager.email) {
            console.log(financeManager.email);
            // Prepare HTML email content with CSS
            const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Project Tasks Completed</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Project Tasks Completed</h1>
                    <p>Dear ${financeManager.fullName},</p>
                    <p>We are pleased to inform you that all tasks for the project <span style="font-weight: bold; color: #3498db;">"${project.projectName}"</span> have been successfully completed.</p>
                    <div style="background-color: #f9f9f9; border-left: 4px solid #3498db; padding: 15px; margin-top: 20px;">
                        <p><strong>Project Details:</strong></p>
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li>Project Name: ${project.projectName}</li>
                            <li>Project Type: ${project.projectType}</li>
                            <li>Department: ${project.department}</li>
                            <li>Start Date: ${project.startDate.toDateString()}</li>
                            <li>End Date: ${project.endDate ? project.endDate.toDateString() : 'Not specified'}</li>
                        </ul>
                    </div>
                    <p>Please review the project details and take any necessary actions.</p>
                    <p>If you have any questions or need further information, please don't hesitate to contact the project manager.</p>
                    <p>Thank you for your attention to this matter.</p>
                    <p>Best regards,<br>Project Management Team</p>
                    <p style="font-size: 12px; color: #888; margin-top: 20px;">This is an automated message. Please do not reply to this email.</p>
                </div>
            </body>
            </html>
            `;
            
            const mailOptions = {
              from: {
                name: "IDO",
                address: process.env.Email_Sender
              },
              to: financeManager.email,
              subject: `Project Completed: ${project.projectName}`,
              html: htmlContent,
              text: `Project Tasks Completed for ${project.projectName}. Please review the project details and take any necessary actions.`
            };
  
            transporter.sendMail(mailOptions, async (error, info) => {
              if (error) {
                console.error('Error sending email:', error);
              } else {
                console.log('Email sent:', info.response);
              }
            });

            const notificationMessage = `All tasks for the project "${project.projectName}" have been completed.`;
            const notification = new GaapNotification({
              user: financeManager._id,
              message: notificationMessage,
              department: project.department, 
            });

            await notification.save();
          }
        }
      }
  
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
  
      const user = await GaapUser.findById(adminId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      let tasksQuery = { project: projectId };
      tasksQuery.teamId = user.teamId;

      const executiveRoles = ['Accounting Executive', 'Audit Executive', 'Tax Executive', 'ICV Executive'];
  
      console.log(userRole)
      if (executiveRoles.includes(userRole)) {
        console.log('executive so using assignTo')
        // For executive roles, only return tasks assigned to them
        tasksQuery['assignedTo'] = adminId;
      } else if (['admin', 'Operation Manager', 'Sales Executive', 'Sales Manager','Finance Manager'].includes(userRole)) {
        console.log('uperlevel so using teamId')
        tasksQuery.teamId = user.teamId;
      } else {
        console.log('oper so using department')
        tasksQuery.$or = [
          { createdBy: adminId },
          { department: project.department }
        ];
      }
      console.log(tasksQuery)
      const tasks = await GaapTask.find(tasksQuery)
        .populate('assignedTo', 'fullName')
        .populate('createdBy', 'fullName');
  
      res.json(tasks);
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
  },

  // Start time tracking for a task
  startTask: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { taskId } = req.query;
      const task = await GaapTask.findById(taskId);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if task is already started and not ended
      const existingLog = await GaapLogSheet.findOne({
        taskId: taskId,
        userId: req.adminId,
        endTime: { $exists: false }
      });

      if (existingLog) {
        return res.status(400).json({ 
          message: 'Task is already in progress',
          startedAt: existingLog.date
        });
      }

      const now = new Date();
      
      // Create new log entry with start time
      const logSheet = new GaapLogSheet({
        userId: req.adminId,
        taskId: taskId,
        date: now,
        startTime: now,
        timeSpent: 0,
        status: 'Pending'
      });
      
      await logSheet.save({ session });

      // Update task status
      task.status = 'In Progress';
      task.startTime = now;
      await task.save({ session });

      await session.commitTransaction();
      res.status(200).json({ 
        message: 'Task started successfully', 
        task,
        logSheet
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: 'Error starting task', error: error.message });
    } finally {
      session.endSession();
    }
  },

  // End time tracking for a task
  endTask: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { taskId } = req.query;
      const { breakDuration = 0, notes } = req.body;
      
      // Find task and active log
      const task = await GaapTask.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Find the active log entry for this task
      const activeLog = await GaapLogSheet.findOne({
        taskId: taskId,
        userId: req.adminId,
        endTime: { $exists: false }
      });

      if (!activeLog) {
        return res.status(400).json({ message: 'No active time tracking found for this task' });
      }

      const now = new Date();
      const startTime = new Date(activeLog.startTime);
      
      // Ensure end time is after start time
      if (now <= startTime) {
        return res.status(400).json({ 
          message: 'End time must be after start time',
          startTime: startTime,
          endTime: now
        });
      }

      // Calculate total duration in milliseconds
      const durationMs = now.getTime() - startTime.getTime();
      
      // Convert to minutes and round to 2 decimal places
      const totalMinutes = Math.round((durationMs / (1000 * 60)) * 100) / 100;
      console.log('Total minutes worked (before break):', totalMinutes);
      
      // Use the break duration provided by the user
      const userBreakDuration = parseInt(breakDuration) || 0;
      console.log('User provided break duration:', userBreakDuration);
      
      // Calculate actual working time by subtracting break
      const actualMinutes = Math.max(0, totalMinutes);
      console.log('Actual working minutes (before break deduction):', actualMinutes);

      // Check for overtime (8 hours = 480 minutes)
      const isOvertime = actualMinutes > 480;

      // Update the log entry
      const updatedLog = await GaapLogSheet.findByIdAndUpdate(
        activeLog._id,
        {
          $set: {
            endTime: now,
            timeSpent: actualMinutes,
            breakTime: userBreakDuration, // Use the user-provided break duration
            overtime: isOvertime,
            notes: notes,
            workType: isOvertime ? 'Overtime' : 'Regular'
          }
        },
        { new: true, session }
      );

      if (!updatedLog) {
        throw new Error('Failed to update log entry');
      }

      // Calculate cumulative time for the task
      const allTaskLogs = await GaapLogSheet.find({
        taskId: taskId,
        endTime: { $exists: true }
      });

      const totalTaskTime = allTaskLogs.reduce((total, log) => total + (log.timeSpent || 0), 0);
      const totalTaskBreaks = allTaskLogs.reduce((total, log) => total + (log.breakTime || 0), 0);

      // Update task with cumulative times
      const updatedTask = await GaapTask.findByIdAndUpdate(
        taskId,
        {
          $set: {
            timeSpent: totalTaskTime,
            breakDuration: totalTaskBreaks,
            endTime: now,
            isOvertime: isOvertime
          }
        },
        { new: true, session }
      );

      if (!updatedTask) {
        throw new Error('Failed to update task');
      }

      await session.commitTransaction();
      
      res.status(200).json({
        message: 'Task ended successfully',
        timeSpent: actualMinutes,
        breakTime: userBreakDuration,
        overtime: isOvertime,
        logSheet: updatedLog,
        task: updatedTask,
        details: {
          totalMinutes,
          breakDuration: userBreakDuration,
          startTime: startTime,
          endTime: now,
          calculationBreakdown: {
            totalTimeInMinutes: totalMinutes,
            breakDuration: userBreakDuration,
            actualWorkingTime: actualMinutes,
            isOvertime: isOvertime,
            taskTotalTime: totalTaskTime,
            taskTotalBreaks: totalTaskBreaks
          }
        }
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Error in endTask:', error);
      res.status(500).json({ message: 'Error ending task', error: error.message });
    } finally {
      session.endSession();
    }
  },

  // Get task logs for reporting
  getTaskLogs: async (req, res) => {
    try {
      const { taskId } = req.query;
      
      const query = {};
      
      if (taskId) query.taskId = taskId;

      const logs = await GaapLogSheet.find(query)
        .populate('userId', 'fullName email')
        .populate('taskId', 'title description')
        .sort({ date: -1 });

      // Calculate summary statistics
      const summary = {
        totalTime: 0,
        totalBreakTime: 0,
        overtimeHours: 0,
        regularHours: 0,
        totalTasks: new Set(logs.map(log => log.taskId._id)).size,
        completedTasks: logs.filter(log => log.endTime).length,
        inProgressTasks: logs.filter(log => !log.endTime).length
      };

      // Process each log entry
      logs.forEach(log => {
        if (log.endTime) {
          // Recalculate time spent if needed
          if (!log.timeSpent && log.startTime && log.endTime) {
            const startTime = new Date(log.startTime);
            const endTime = new Date(log.endTime);
            const durationMs = endTime.getTime() - startTime.getTime();
            log.timeSpent = Math.round((durationMs / (1000 * 60)) * 100) / 100;
          }

          const timeSpent = log.timeSpent || 0;
          const breakTime = log.breakTime || 0;

          summary.totalTime += timeSpent;
          summary.totalBreakTime += breakTime;

          if (log.overtime) {
            summary.overtimeHours += timeSpent;
          } else {
            summary.regularHours += timeSpent;
          }
        }
      });

      // Convert minutes to hours for better readability
      const hoursData = {
        totalHours: (summary.totalTime / 60).toFixed(2),
        totalBreakHours: (summary.totalBreakTime / 60).toFixed(2),
        overtimeHours: (summary.overtimeHours / 60).toFixed(2),
        regularHours: (summary.regularHours / 60).toFixed(2)
      };

      res.status(200).json({
        logs,
        summary: {
          ...summary,
          ...hoursData
        }
      });
    } catch (error) {
      console.error('Error in getTaskLogs:', error);
      res.status(500).json({ message: 'Error fetching task logs', error: error.message });
    }
  },

  // Get KPI dashboard data
  getKPIData: async (req, res) => {
    try {
      const { executiveId } = req.query;
      const adminId = req.adminId;

      // Find user's team
      const user = await GaapUser.findById(adminId);
      if (!user || !user.teamId) {
        return res.status(400).json({ message: 'User not found or not associated with a team' });
      }

      const teamId = user.teamId;

      // Get team members based on executiveId or teamId
      let teamMembers;
      if (executiveId) {
        // If executiveId is provided, only get that specific executive
        const executive = await GaapUser.findById(executiveId).lean();
        if (!executive || executive.teamId !== teamId) {
          return res.status(400).json({ message: 'Executive not found or not in your team' });
        }
        teamMembers = [executive];
      } else {
        // Otherwise get all team members
        teamMembers = await GaapUser.find({ teamId }).lean();
      }
      
      if (!teamMembers || teamMembers.length === 0) {
        return res.status(200).json({
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          memberPerformance: {},
          overtimeStats: {
            totalOvertimeHours: 0,
            overtimeInstances: 0
          },
          completionRate: 0
        });
      }

      const teamMemberIds = teamMembers.map(member => member._id);

      // Get all tasks for team members
      const tasks = await GaapTask.find({
        assignedTo: { $in: teamMemberIds },
        teamId: teamId
      }).lean();

      // Get all log sheets for the team members
      const logSheets = await GaapLogSheet.find({
        userId: { $in: teamMemberIds }
      }).lean();

      // Calculate KPIs
      const kpiData = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'Completed').length,
        inProgressTasks: tasks.filter(task => task.status === 'In Progress').length,
        pendingTasks: tasks.filter(task => task.status === 'Pending').length,
        memberPerformance: {},
        overtimeStats: {
          totalOvertimeHours: 0,
          overtimeInstances: 0
        }
      };

      // Calculate completion rate (avoid division by zero)
      kpiData.completionRate = kpiData.totalTasks > 0 
        ? ((kpiData.completedTasks / kpiData.totalTasks) * 100).toFixed(2)
        : 0;

      // Calculate member performance
      for (const member of teamMembers) {
        const memberTasks = tasks.filter(task => 
          task.assignedTo && task.assignedTo.toString() === member._id.toString()
        );
        
        const memberLogs = logSheets.filter(log => 
          log.userId && log.userId.toString() === member._id.toString()
        );

        // Calculate total hours worked (convert minutes to hours)
        const totalMinutesWorked = memberLogs.reduce((acc, log) => {
          if (log.timeSpent && log.endTime) { // Only count completed logs
            return acc + (log.timeSpent || 0);
          }
          return acc;
        }, 0);

        // Calculate overtime hours
        const overtimeLogs = memberLogs.filter(log => log.overtime && log.endTime);
        const overtimeMinutes = overtimeLogs.reduce((acc, log) => acc + (log.timeSpent || 0), 0);

        kpiData.memberPerformance[member._id] = {
          name: member.fullName || 'Unknown',
          tasksCompleted: memberTasks.filter(task => task.status === 'Completed').length,
          totalTasksAssigned: memberTasks.length,
          totalHoursWorked: (totalMinutesWorked / 60).toFixed(2),
          overtimeHours: (overtimeMinutes / 60).toFixed(2),
          completionRate: memberTasks.length > 0 
            ? ((memberTasks.filter(task => task.status === 'Completed').length / memberTasks.length) * 100).toFixed(2)
            : 0
        };

        // Update overall overtime stats
        kpiData.overtimeStats.totalOvertimeHours += Number(kpiData.memberPerformance[member._id].overtimeHours);
        kpiData.overtimeStats.overtimeInstances += overtimeLogs.length;
      }

      // Round total overtime hours to 2 decimal places
      kpiData.overtimeStats.totalOvertimeHours = Number(kpiData.overtimeStats.totalOvertimeHours.toFixed(2));

      res.status(200).json(kpiData);
    } catch (error) {
      console.error('Error in getKPIData:', error);
      res.status(500).json({ message: 'Error fetching KPI data', error: error.message });
    }
  }
};

module.exports = taskController;