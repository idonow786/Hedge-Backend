// controllers/reportController.js

const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

const generateReports = async (req, res) => {
    try {
        let { department, month, year } = req.query;

        // If month and year are not provided, use current month
        if (!month || !year) {
            const currentDate = new Date();
            month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
            year = currentDate.getFullYear();
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        let reports = {};

        if (department) {
            reports.departmentReport = await generateDepartmentReport(department, startDate, endDate);
        } else {
            // Generate reports for all departments
            const departments = await GaapUser.distinct('department');
            reports.departmentReports = await Promise.all(
                departments.map(dept => generateDepartmentReport(dept, startDate, endDate))
            );
        }

        // Generate reports for all staff
        const staffReports = await generateAllStaffReports(startDate, endDate);
        reports.staffReports = staffReports;

        res.json(reports);
    } catch (error) {
        console.error('Error in generateReports:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const generateDepartmentReport = async (department, startDate, endDate) => {
    const newProjects = await GaapProject.countDocuments({
        department,
        createdAt: { $gte: startDate, $lte: endDate }
    });

    const pendingProjects = await GaapProject.countDocuments({
        department,
        status: { $in: ['Proposed', 'Approved', 'In Progress', 'On Hold'] },
        createdAt: { $lte: endDate }
    });

    const doneProjects = await GaapProject.countDocuments({
        department,
        status: 'Completed',
        endDate: { $gte: startDate, $lte: endDate }
    });

    const staffPerformance = await GaapUser.aggregate([
        { $match: { department: department } },
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

const generateStaffReport = async (staffId, startDate, endDate) => {
    const staff = await GaapUser.findById(staffId);
    if (!staff) {
        throw new Error('Staff not found');
    }

    const newProjects = await GaapProject.countDocuments({
        assignedTo: staffId,
        createdAt: { $gte: startDate, $lte: endDate }
    });

    const pendingProjects = await GaapProject.countDocuments({
        assignedTo: staffId,
        status: { $in: ['Proposed', 'Approved', 'In Progress', 'On Hold'] },
        createdAt: { $lte: endDate }
    });

    const doneProjects = await GaapProject.countDocuments({
        assignedTo: staffId,
        status: 'Completed',
        endDate: { $gte: startDate, $lte: endDate }
    });

    const projectDetails = await GaapProject.find({
        assignedTo: staffId,
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

const generateAllStaffReports = async (startDate, endDate) => {
    const allStaff = await GaapUser.find();
    return Promise.all(allStaff.map(staff => generateStaffReport(staff._id, startDate, endDate)));
};

module.exports = {
    generateReports
};
