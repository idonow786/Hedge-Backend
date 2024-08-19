// controllers/projectController.js

const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');

const getProjects = async (req, res) => {
    try {

        const { department } = req.query;

        let query = {};
        if (department) {
            query.department = department;
        }

        // Fetch done projects
        const doneProjects = await GaapProject.find({ ...query, status: 'Completed' })
            .select('projectName customer startDate endDate')
            .populate('customer', 'name')
            .sort({ endDate: -1 });

        const formattedDoneProjects = doneProjects.map(project => ({
            projectName: project.projectName,
            customerName: project.customer.name,
            startDate: project.startDate,
            endDate: project.endDate,
            summary: `Completed project for ${project.customer.name}`
        }));

        // Fetch pending projects
        const pendingProjects = await GaapProject.find({ ...query, assignedTo: null })
            .select('projectName customer')
            .populate('customer', 'name');

        const formattedPendingProjects = pendingProjects.map(project => ({
            projectName: project.projectName,
            customerName: project.customer.name,
            _id: project._id
        }));

        // Fetch ongoing projects
        const ongoingProjects = await GaapProject.find({ ...query, status: 'In Progress' })
            .select('projectName assignedTo startDate endDate')
            .populate('assignedTo', 'name');

        const formattedOngoingProjects = await Promise.all(ongoingProjects.map(async (project) => {
            const comments = await GaapComment.find({ project: project._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'name');

            return {
                projectName: project.projectName,
                assignedStaff: project.assignedTo ? project.assignedTo.name : 'Unassigned',
                assignDate: project.startDate,
                deadline: project.endDate,
                recentComments: comments.map(comment => ({
                    content: comment.content,
                    user: comment.user.name,
                    createdAt: comment.createdAt
                }))
            };
        }));

        res.json({
            doneProjects: formattedDoneProjects,
            pendingProjects: formattedPendingProjects,
            ongoingProjects: formattedOngoingProjects
        });

    } catch (error) {
        console.error('Error in getProjects:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = { getProjects };
