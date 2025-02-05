// controllers/dashboardController.js

const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../Model/Gaap/gaap_team');

const getDashboardData = async (req, res) => {
    try {
        const userId = req.adminId;
        const user = await GaapUser.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the team where the user is either parentUser or GeneralUser
        const team = await GaapTeam.findOne({
            $or: [
                { 'parentUser.userId': userId },
                { 'GeneralUser.userId': userId }
            ]
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found for this user' });
        }

        const teamId = team._id;
        const branchId=user.branchId;
        const dashboardData = {
            projectsOverview: await getProjectsOverview(teamId,branchId),
            departmentPerformance: await getDepartmentPerformance(teamId,branchId),
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getProjectsOverview = async (teamId,branchId) => {
    try {
        const allProjects = await GaapProject.find({ 
            teamId,
            branchId,
            status: { $ne: 'Cancelled' }
        })
            .select('-totalAmount')
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
                    progress: project.Progress || 0,
                    viewProjectUrl: `/projects/${project._id}`
                }))
        };
    } catch (error) {
        console.error('Error in getProjectsOverview:', error);
        throw error;
    }
};

const getDepartmentPerformance = async (teamId,branchId) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const departmentPerformance = await GaapProject.aggregate([
            { $match: { teamId: teamId.toString(),branchId:branchId } }, // Convert ObjectId to string if necessary
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