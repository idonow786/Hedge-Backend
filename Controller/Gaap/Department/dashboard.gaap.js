// controllers/dashboardController.js

const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../Model/Gaap/gaap_user');

const getDashboardData = async (req, res) => {
    try {
        const userId = req.adminId;
        const user = await GaapUser.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const teamId = user.teamId;

        const dashboardData = {
            projectsOverview: await getProjectsOverview(teamId),
            departmentPerformance: await getDepartmentPerformance(teamId),
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getProjectsOverview = async (teamId) => {
    try {
        const allProjects = await GaapProject.find({ teamId })
            .select('-totalAmount') // Exclude price information
            .populate('customer', 'name')
            .populate('assignedTo', 'fullName')
            .lean();

        const ongoingProjects = allProjects.filter(project => 
            ['Proposed', 'Approved', 'In Progress'].includes(project.status)
        );

        const pendingProjects = allProjects.filter(project => 
            project.status === 'On Hold'
        );

        return {
            totalProjects: allProjects.length,
            ongoingProjects: ongoingProjects.length,
            pendingProjects: pendingProjects.length,
            recentProjects: allProjects
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5)
                .map(project => ({
                    _id: project._id,
                    projectName: project.projectName,
                    assignedTo: project.assignedTo ? project.assignedTo.fullName : 'N/A',
                    status: project.status,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    progress: project.Progress || 0, // Using the Progress field from the schema, defaulting to 0 if not set
                    viewProjectUrl: `/projects/${project._id}`
                }))
        };
    } catch (error) {
        console.error('Error in getProjectsOverview:', error);
        throw error;
    }
};

const getDepartmentPerformance = async (teamId) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const departmentPerformance = await GaapProject.aggregate([
            { $match: { teamId: teamId } },
            {
                $group: {
                    _id: "$department",
                    newProjects: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $gte: ["$createdAt", startOfMonth] },
                                    { $lte: ["$createdAt", endOfMonth] }
                                ]},
                                1, 0
                            ]
                        }
                    },
                    completedProjects: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: ["$status", "Completed"] },
                                    { $gte: ["$endDate", startOfMonth] },
                                    { $lte: ["$endDate", endOfMonth] }
                                ]},
                                1, 0
                            ]
                        }
                    },
                    ongoingProjects: {
                        $sum: {
                            $cond: [{ $in: ["$status", ["Proposed", "Approved", "In Progress"]] }, 1, 0]
                        }
                    }
                }
            },
            { $project: {
                department: "$_id",
                newProjects: 1,
                completedProjects: 1,
                ongoingProjects: 1,
                _id: 0
            }}
        ]);

        return departmentPerformance;
    } catch (error) {
        console.error('Error in getDepartmentPerformance:', error);
        throw error;
    }
};

module.exports = {
    getDashboardData
};
