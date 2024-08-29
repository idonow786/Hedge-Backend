const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');

const getProjectsAll = async (req, res) => {
    try {
        const { adminId } = req;
        let projects = [];

        // Check if the user is a team parent
        const parentTeam = await GaapTeam.findOne({
            $or: [
                { 'parentUser.userId': req.adminId },
                { 'GeneralUser.userId': req.adminId }
            ]
        });

        if (parentTeam) {
            // If user is a team parent, get all projects with matching teamId
            projects = await GaapProject.find({ teamId: parentTeam._id })
                .populate('customer')
                .populate('assignedTo')
                .populate('salesPerson')
                .populate('tasks')
                .populate('discountApprovedBy')
                .populate('invoices')
                .populate('payments')
                .populate('createdBy')
                .populate('lastUpdatedBy');
        } else {
            // Check if the user is a manager in any team
            const managerTeam = await GaapTeam.findOne({ 'members.managerId': adminId });

            if (managerTeam) {
                // If user is a manager, get all projects created by team members and the manager
                const teamMemberIds = managerTeam.members.map(member => member.memberId);
                teamMemberIds.push(adminId);
                projects = await GaapProject.find({
                    $or: [
                        { createdBy: { $in: teamMemberIds } },
                        { createdBy: adminId }
                    ]
                })
                    .populate('customer')
                    .populate('assignedTo')
                    .populate('salesPerson')
                    .populate('tasks')
                    .populate('discountApprovedBy')
                    .populate('invoices')
                    .populate('payments')
                    .populate('createdBy')
                    .populate('lastUpdatedBy');
            } else {
                // If user is neither a parent nor a manager, get projects created by the user
                projects = await GaapProject.find({ createdBy: adminId })
                    .populate('customer')
                    .populate('assignedTo')
                    .populate('salesPerson')
                    .populate('tasks')
                    .populate('discountApprovedBy')
                    .populate('invoices')
                    .populate('payments')
                    .populate('createdBy')
                    .populate('lastUpdatedBy');
            }
        }

        const formattedProjects = await Promise.all(projects.map(async project => {
            const projectProducts = await GaapProjectProduct.find({ project: project._id });

            // Calculate progress based on completed tasks
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            if (progress >= 100 && project.status !== 'Completed') {
                project.status = 'Completed';
                await project.save();
            }

            return {
                _id: project._id,
                projectName: project.projectName,
                customer: project.customer,
                projectType: project.projectType,
                department: project.department,
                assignedTo: project.assignedTo,
                salesPerson: project.salesPerson,
                financialApproval: project.financialApproval,
                customerApproval: project.customerApproval,
                salesManagerApproval: project.salesManagerApproval,
                startDate: project.startDate,
                teamId: project.teamId,
                endDate: project.endDate,
                status: project.status,
                pricingType: project.pricingType,
                totalAmount: project.totalAmount,
                Progress: project.Progress,
                appliedDiscount: project.appliedDiscount,
                discountApprovedBy: project.discountApprovedBy,
                products: project.products,
                tasks: project.tasks,
                documents: project.documents,
                notes: project.notes,
                approvals: project.approvals,
                invoices: project.invoices,
                description:project.description,
                payments: project.payments,
                vatDetails: project.vatDetails,
                createdBy: project.createdBy,
                lastUpdatedBy: project.lastUpdatedBy,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                progress: progress, // Add the calculated progress
                formattedProducts: projectProducts.map(prod => ({
                    _id: prod._id,
                    name: prod.name,
                    description: prod.description,
                    quantity: prod.quantity,
                    price: prod.price,
                    turnoverRange: prod.turnoverRange,
                    timeDeadline: prod.timeDeadline,
                    category: prod.category,
                    subCategory: prod.subCategory,
                    department: prod.department,
                    priceType: prod.priceType,
                    isVatProduct: prod.isVatProduct
                }))
            };
        }));

        res.json(formattedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};

module.exports = { getProjectsAll };