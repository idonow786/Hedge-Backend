// controllers/dashboardController.js

const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapTask = require('../../../Model/Gaap/gaap_task');

const getDashboardDataDepartment = async (req, res) => {
    try {
        const userId = req.adminId;
        const user = await GaapUser.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const teamId = user.teamId;

        // Get projects based on tasks created by or assigned to the user
        const relevantProjects = await getRelevantProjects(userId);

        const dashboardData = {
            projectsOverview: await getProjectsOverview(relevantProjects),
            departmentPerformance: await getDepartmentPerformance(relevantProjects),
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Error in getDashboardData:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getRelevantProjects = async (userId) => {
    // Find tasks created by or assigned to the user
    const tasks = await GaapTask.find({
        $or: [
            { createdBy: userId },
            { assignedTo: userId }
        ]
    }).distinct('project');

    // Get the projects associated with these tasks
    return await GaapProject.find({ _id: { $in: tasks } });
};

const getProjectsOverview = async (projects) => {
    try {
        const allProjects = projects;

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

const getDepartmentPerformance = async (projects) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const departmentPerformance = projects.reduce((acc, project) => {
            const dept = project.department;
            if (!acc[dept]) {
                acc[dept] = { newProjects: 0, completedProjects: 0, ongoingProjects: 0 };
            }

            if (project.createdAt >= startOfMonth && project.createdAt <= endOfMonth) {
                acc[dept].newProjects++;
            }

            if (project.status === 'Completed' && project.endDate >= startOfMonth && project.endDate <= endOfMonth) {
                acc[dept].completedProjects++;
            }

            if (['Proposed', 'Approved', 'In Progress'].includes(project.status)) {
                acc[dept].ongoingProjects++;
            }

            return acc;
        }, {});

        return Object.entries(departmentPerformance).map(([department, data]) => ({
            department,
            ...data
        }));
    } catch (error) {
        console.error('Error in getDepartmentPerformance:', error);
        throw error;
    }
};

module.exports = {
    getDashboardDataDepartment
};