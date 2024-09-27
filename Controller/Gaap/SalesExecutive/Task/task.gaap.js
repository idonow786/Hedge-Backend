const GaapTask = require('../../../../Model/Gaap/gaap_task');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapNotification = require('../../../../Model/Gaap/gaap_notification');
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
          console.log(financeManager.email)
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

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending email:', error);
            } else {
              console.log('Email sent:', info.response);
            }
          });
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
  }
};

module.exports = taskController;