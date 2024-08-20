const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

const getProjects = async (req, res) => {
    try {
        const { department } = req.query;
        const adminId = req.adminId;

        // Fetch the user's team ID
        const user = await GaapUser.findById(adminId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const teamId = user.teamId;

        let query = { teamId };
        if (department) {
            query.department = department;
        }

        // Helper function to format projects
        const formatProjects = async (projects, includeComments = false) => {
            return Promise.all(projects.map(async (project) => {
                let formattedProject = {
                    projectName: project.projectName,
                    customerName: project.customer ? project.customer.name : 'N/A',
                    assignedStaff: project.assignedTo ? project.assignedTo.name : 'Unassigned',
                    startDate: project.startDate,
                    endDate: project.endDate,
                    _id: project._id
                };

                if (includeComments) {
                    const comments = await GaapComment.find({ project: project._id })
                        .sort({ createdAt: -1 })
                        .limit(5)
                        .populate('user', 'name');

                    formattedProject.recentComments = comments.map(comment => ({
                        content: comment.content,
                        user: comment.user.name,
                        createdAt: comment.createdAt
                    }));
                }

                return formattedProject;
            }));
        };

        // Fetch projects for each status
        const completedProjects = await GaapProject.find({ ...query, status: 'Completed' })
            .select('projectName customer startDate endDate')
            .populate('customer', 'name')
            .sort({ endDate: -1 });

        const pendingProjects = await GaapProject.find({ ...query, assignedTo: null })
            .select('projectName customer')
            .populate('customer', 'name');

        const inProgressProjects = await GaapProject.find({ ...query, status: 'In Progress' })
            .select('projectName assignedTo startDate endDate')
            .populate('assignedTo', 'name')
            .populate('customer', 'name');

        const approvedProjects = await GaapProject.find({ ...query, status: 'Approved' })
            .select('projectName assignedTo startDate endDate')
            .populate('assignedTo', 'name')
            .populate('customer', 'name');

        const proposedProjects = await GaapProject.find({ ...query, status: 'Proposed' })
            .select('projectName assignedTo startDate endDate')
            .populate('assignedTo', 'name')
            .populate('customer', 'name');

        // Format projects
        const formattedCompletedProjects = await formatProjects(completedProjects);
        const formattedPendingProjects = await formatProjects(pendingProjects);
        const formattedInProgressProjects = await formatProjects(inProgressProjects, true);
        const formattedApprovedProjects = await formatProjects(approvedProjects, true);
        const formattedProposedProjects = await formatProjects(proposedProjects, true);

        res.json({
            completedProjects: formattedCompletedProjects,
            pendingProjects: formattedPendingProjects,
            inProgressProjects: formattedInProgressProjects,
            approvedProjects: formattedApprovedProjects,
            proposedProjects: formattedProposedProjects
        });

    } catch (error) {
        console.error('Error in getProjects:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = { getProjects };
