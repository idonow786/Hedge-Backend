// controllers/dashboardController.js

const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../Model/Gaap/gaap_user');

const getDashboardData = async (req, res) => {
    try {
        const userId = req.adminId;
        const user = await GaapUser.findById(userId);
        console.log(req.role)
        if (
            req.role !== 'Department Manager' && 
            req.role !== 'Operational Executive' && 
            req.role !== 'admin' && 
            req.role !== 'General Manager'
        ) {
            return res.status(403).json({ message: 'Not Authorized' });
        }

        const dashboardData = {
            projectsOverview: await getProjectsOverview(),
            departmentPerformance: await getDepartmentPerformance(),
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getProjectsOverview = async () => {
    try {
        const allProjects = await GaapProject.find()
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
                viewProjectUrl: `/projects/${project._id}` // Frontend URL for viewing project details
            }))
        };
    } catch (error) {
        console.error('Error in getProjectsOverview:', error);
        throw error;
    }
};

const getDepartmentPerformance = async () => {
    try {
        const departments = await GaapUser.distinct('department');

        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const departmentPerformance = await Promise.all(departments.map(async (department) => {
            const newProjects = await GaapProject.countDocuments({
                department,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            const completedProjects = await GaapProject.countDocuments({
                department,
                status: 'Completed',
                endDate: { $gte: startOfMonth, $lte: endOfMonth }
            });

            const ongoingProjects = await GaapProject.countDocuments({
                department,
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
