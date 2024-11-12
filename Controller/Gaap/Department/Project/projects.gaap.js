const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapTask = require('../../../../Model/Gaap/gaap_task');
const GaapProjectProduct=require('../../../../Model/Gaap/gaap_product')
const ProjectPayment=require('../../../../Model/Gaap/gaap_payment')
const getProjects = async (req, res) => {
    try {
        const { department } = req.query;
        const adminId = req.adminId;
        const userRole = req.role;
        console.log(userRole);

        // Fetch the user's team ID
        const user = await GaapUser.findById(adminId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const teamId = user.teamId;

        let query = { teamId, financialApproval: true, operationsManagerApproval: true };
        
        // Handle department query based on role
        if (['Tax Executive', 'Tax Supervisor'].includes(userRole)) {
            // For Tax and Tax Executive, always show VAT Filing department
            query.department = 'VAT Filing';
        } else if (['Audit Manager', 'Audit Executive'].includes(userRole)) {
            // For Audit Manager and Executive, show both their department and Compliance Manager
            query.department = { $in: [department, 'Compliance Manager'] };
        } else if (department) {
            // For other roles, use the department from query if provided
            query.department = department;
        }

        let projects;
        const executiveRoles = ['Accounting Executive', 'Audit Executive', 'Tax Executive', 'ICV Executive'];
        
        if (executiveRoles.includes(userRole)) {
            // Fetch projects where the user is assigned to at least one task
            const tasksWithUser = await GaapTask.find({ assignedTo: adminId }).distinct('project');
            projects = await GaapProject.find({ ...query, _id: { $in: tasksWithUser } })
                .select('projectName customer assignedTo startDate endDate status projectType department totalAmount')
                .populate('customer')
                .populate('assignedTo', 'name')
                .sort({ createdAt: -1 });
        } else {
            // Fetch all projects for other roles
            projects = await GaapProject.find(query)
                .select('projectName customer assignedTo startDate endDate status projectType department totalAmount')
                .populate('customer')
                .populate('assignedTo', 'name')
                .sort({ createdAt: -1 });
        }

        // Helper function to format projects
        const formatProjects = async (projects) => {
            return Promise.all(projects.map(async (project) => {
                // Calculate task progress
                const tasks = await GaapTask.find({ project: project._id });
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(task => task.status === 'Completed').length;
                const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                let payment = await ProjectPayment.findOne({ project: project._id });

                // Update project status if all tasks are completed
                if (taskProgress === 100 && project.status !== 'Completed'&&payment.paymentStatus === 'Fully Paid') {
                    project.status = 'Completed';
                    await project.save();
                }
                const projectProducts = await GaapProjectProduct.find({ project: project._id }).lean();
                console.log(project)
                let formattedProject = {
                    _id: project._id,
                    projectName: project.projectName,
                    customerName: project.customer ? project.customer.name : 'N/A',
                    assignedStaff: project.assignedTo ? project.assignedTo.name : 'Unassigned',
                    startDate: project.startDate,
                    endDate: project.endDate,
                    TotalAmount:project.totalAmount,
                    status: project.status,
                    projectType: project.projectType,
                    taskProgress: taskProgress,
                    department: project.department,
                    projectProducts
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