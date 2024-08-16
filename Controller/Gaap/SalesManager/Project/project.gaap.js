const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product'); 

const getProjectsAll = async (req, res) => {
    try {
        // if (req.role !== 'Sales Manager') {
        //     return res.status(403).json({ message: 'Access denied. Only sales manager can view projects.' });
        // }

        const projects = await GaapProject.find()
            .populate('customer')
            .populate('assignedTo')
            .populate('salesPerson');

        const formattedProjects = await Promise.all(projects.map(async project => {
            const projectProducts = await GaapProjectProduct.find({ project: project._id });

            const { 
                _id, 
                projectName, 
                customer, 
                projectType, 
                status, 
                startDate, 
                endDate, 
                totalAmount, 
                Progress, 
                appliedDiscount,
                assignedTo,
                salesManagerApproval,
                customerApproval,
                financialApproval, 
                salesPerson
            } = project;

            return {
                _id,
                projectName,
                appliedDiscount,
                Progress,
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
