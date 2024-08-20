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
            projects: allProjects.map(project => ({
                ...project,
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
        const departments = await GaapUser.distinct('department', { teamId });

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const departmentPerformance = await Promise.all(departments.map(async (department) => {
            const newProjects = await GaapProject.countDocuments({
                department,
                teamId,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            const completedProjects = await GaapProject.countDocuments({
                department,
                teamId,
                status: 'Completed',
                endDate: { $gte: startOfMonth, $lte: endOfMonth }
            });

            const ongoingProjects = await GaapProject.countDocuments({
                department,
                teamId,
                status: { $in: ['Proposed', 'Approved', 'In Progress'] }
            });

            return {
                department,
                newProjects,
                completedProjects,
                ongoingProjects
            };
        }));

        return departmentPerformance;
    } catch (error) {
        console.error('Error in getDepartmentPerformance:', error);
        throw error;
    }
};

module.exports = {
    getDashboardData
};
