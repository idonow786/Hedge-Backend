// controllers/reportController.js

const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

const generateReports = async (req, res) => {
  try {
    let { department, month, year } = req.query;
    const adminId = req.adminId;

    // Fetch the user's team ID
    const user = await GaapUser.findById(adminId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const teamId = user.teamId;
    const branchId = user.branchId;

    // If month and year are not provided, use current month
    if (!month || !year) {
      const currentDate = new Date();
      month = currentDate.getMonth() + 1;
      year = currentDate.getFullYear();
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let reports = {};

    if (department) {
      reports.departmentReport = await generateDepartmentReport(department, startDate, endDate, teamId,branchId);
    } else {
      // Generate reports for all departments within the team
      const departments = await GaapUser.distinct('department', { teamId });
      reports.departmentReports = await Promise.all(
        departments.map(dept => generateDepartmentReport(dept, startDate, endDate, teamId,branchId))
      );

      // Generate reports for all staff within the team, excluding Operational Managers and Admins
      const staffReports = await generateAllStaffReports(startDate, endDate, teamId,branchId);
      reports.staffReports = staffReports;
    }

    res.json(reports);
  } catch (error) {
    console.error('Error in generateReports:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const generateDepartmentReport = async (department, startDate, endDate, teamId,branchId) => {
  const newProjects = await GaapProject.countDocuments({
    department,
    teamId,
    branchId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const pendingProjects = await GaapProject.countDocuments({
    department,
    teamId,
    branchId,
    status: { $in: ['Proposed', 'Approved', 'In Progress', 'On Hold'] },
    createdAt: { $lte: endDate }
  });

  const doneProjects = await GaapProject.countDocuments({
    department,
    teamId,
    branchId,
    status: 'Completed',
    endDate: { $gte: startDate, $lte: endDate }
  });

  const staffPerformance = await GaapUser.aggregate([
    { $match: { department: department, teamId: teamId,branchId:branchId } },
    {
      $lookup: {
        from: 'gaapprojects',
        localField: '_id',
        foreignField: 'assignedTo',
        as: 'projects'
      }
    },
    {
      $project: {
        fullName: 1,
        newProjects: {
          $size: {
            $filter: {
              input: '$projects',
              as: 'project',
              cond: {
                $and: [
                  { $eq: ['$$project.teamId', teamId] },
                  { $gte: ['$$project.createdAt', startDate] },
                  { $lte: ['$$project.createdAt', endDate] }
                ]
              }
            }
          }
        },
        completedProjects: {
          $size: {
            $filter: {
              input: '$projects',
              as: 'project',
              cond: {
                $and: [
                  { $eq: ['$$project.teamId', teamId] },
                  { $eq: ['$$project.status', 'Completed'] },
                  { $gte: ['$$project.endDate', startDate] },
                  { $lte: ['$$project.endDate', endDate] }
                ]
              }
            }
          }
        }
      }
    }
  ]);

  return {
    department,
    newProjects,
    pendingProjects,
    doneProjects,
    staffPerformance
  };
};

const generateStaffReport = async (staffId, startDate, endDate, teamId,branchId) => {
  const staff = await GaapUser.findOne({ _id: staffId, teamId,branchId });
  if (!staff) {
    throw new Error('Staff not found or not in the same team');
  }

  const newProjects = await GaapProject.countDocuments({
    assignedTo: staffId,
    teamId,
    branchId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const pendingProjects = await GaapProject.countDocuments({
    assignedTo: staffId,
    teamId,
    branchId,
    status: { $in: ['Proposed', 'Approved', 'In Progress', 'On Hold'] },
    createdAt: { $lte: endDate }
  });

  const doneProjects = await GaapProject.countDocuments({
    assignedTo: staffId,
    teamId,
    branchId,
    status: 'Completed',
    endDate: { $gte: startDate, $lte: endDate }
  });

  const projectDetails = await GaapProject.find({
    assignedTo: staffId,
    teamId,
    branchId,
    $or: [
      { createdAt: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { status: { $in: ['Proposed', 'Approved', 'In Progress', 'On Hold'] } }
    ]
  }).select('projectName status startDate endDate');

  return {
    staffId: staff._id,
    staffName: staff.fullName,
    department: staff.department,
    newProjects,
    pendingProjects,
    doneProjects,
    projectDetails
  };
};

const generateAllStaffReports = async (startDate, endDate, teamId,branchId) => {
  const allStaff = await GaapUser.find({ 
    teamId, 
    branchId,
    role: { $nin: ['Operation Manager', 'admin'] } 
  });
  return Promise.all(allStaff.map(staff => generateStaffReport(staff._id, startDate, endDate, teamId,branchId)));
};

module.exports = {
  generateReports
};