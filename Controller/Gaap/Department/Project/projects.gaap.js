const GaapProject = require('../../../../Model/Gaap/gaap_project');
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
        const formatProjects = async (projects) => {
            return Promise.all(projects.map(async (project) => {
                let formattedProject = {
                    _id: project._id,
                    projectName: project.projectName,
                    customerName: project.customer ? project.customer.name : 'N/A',
                    assignedStaff: project.assignedTo ? project.assignedTo.name : 'Unassigned',
                    startDate: project.startDate,
                    endDate: project.endDate,
                    status: project.status
                };

                if (['In Progress', 'Approved', 'Proposed'].includes(project.status)) {
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

        // Fetch all projects
        const projects = await GaapProject.find(query)
            .select('projectName customer assignedTo startDate endDate status')
            .populate('customer', 'name')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 });

        // Format projects
        const formattedProjects = await formatProjects(projects);

        res.json({
            projects: formattedProjects
        });

    } catch (error) {
        console.error('Error in getProjects:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

module.exports = { getProjects };
