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
            .populate('tasks');
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
                .populate('tasks');
            } else {
                // If user is neither a parent nor a manager, get projects created by the user
                projects = await GaapProject.find({ createdBy: adminId })
                    .populate('customer')
                    .populate('assignedTo')
                    .populate('salesPerson')
                    .populate('tasks');
            }
        }

        const formattedProjects = await Promise.all(projects.map(async project => {
            const projectProducts = await GaapProjectProduct.find({ project: project._id });

            // Calculate progress based on completed tasks
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const { 
                _id, 
                projectName, 
                customer, 
                projectType, 
                status, 
                startDate, 
                endDate, 
                totalAmount, 
                appliedDiscount,
                assignedTo,
                salesManagerApproval,
                customerApproval,
                financialApproval, 
                salesPerson,
                teamId
            } = project;

            return {
                _id,
                projectName,
                appliedDiscount,
                progress,
                customer,
                projectType,
                status,
                startDate,
                salesManagerApproval,
                customerApproval,
                financialApproval, 
                endDate,
                totalAmount,
                assignedTo,
                salesPerson,
                teamId,
                products: projectProducts.map(prod => ({
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