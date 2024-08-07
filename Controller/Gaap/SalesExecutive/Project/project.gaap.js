const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');
const { uploadFileToFirebase } = require('../../../../Firebase/uploadFileToFirebase');

const createProject = async (req, res) => {
    try {
        const {
            projectName,
            customerId,
            projectType,
            department,
            assignedToId,
            salesPersonId,
            startDate,
            endDate,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            discountApprovedById,
            products,
            vatDetails
        } = req.body;

        if (!projectName || !customerId || !projectType || !department || !assignedToId || !salesPersonId || !startDate || !pricingType || !totalAmount || !products || !Array.isArray(products)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const customer = await GaapCustomer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const [assignedTo, salesPerson] = await Promise.all([
            GaapUser.findById(assignedToId),
            GaapUser.findById(salesPersonId)
        ]);
        if (!assignedTo || !salesPerson) {
            return res.status(404).json({ message: 'Assigned user or sales person not found' });
        }

        let vatCertificateUrl = '';
        if (req.files && req.files.vatCertificate) {
            const vatCertificateFile = req.files.vatCertificate[0];
            vatCertificateUrl = await uploadFileToFirebase(vatCertificateFile.buffer, vatCertificateFile.originalname);
        }

        const documents = [];
        if (req.files && req.files.documents) {
            for (const doc of req.files.documents) {
                const url = await uploadFileToFirebase(doc.buffer, doc.originalname);
                documents.push({
                    name: doc.originalname,
                    url: url,
                    uploadedBy: req.adminId,
                    uploadDate: new Date()
                });
            }
        }

        const newProject = new GaapProject({
            projectName,
            customer: customerId,
            projectType,
            department,
            assignedTo: assignedToId,
            salesPerson: salesPersonId,
            startDate,
            endDate,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            discountApprovedBy: discountApprovedById,
            vatDetails: {
                ...vatDetails,
                vatCertificate: vatCertificateUrl
            },
            documents: documents,
            createdBy: req.adminId
        });

        await newProject.save();

        const projectProducts = await Promise.all(products.map(async (product) => {
            const projectProduct = new GaapProjectProduct({
                project: newProject._id,
                name: product.name,
                category: product.category,
                subCategory: product.subCategory,
                department: product.department,
                priceType: product.priceType,
                price: product.price,
                quantity: product.quantity,
                timeDeadline: product.timeDeadline,
                turnoverRange: product.turnoverRange,
                isVatProduct: product.isVatProduct
            });

            await projectProduct.save();
            return projectProduct._id;
        }));

        newProject.products = projectProducts;
        await newProject.save();

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};





const getProjects = async (req, res) => {
    try {
        if (req.role !== 'Sales Executive') {
            return res.status(403).json({ message: 'Access denied. Only sales executives can view projects.' });
        }

        const projects = await GaapProject.find({ createdBy: req.adminId })
            .populate('customer', 'name')
            .populate('assignedTo', 'name')
            .populate('salesPerson', 'name')
            .select('projectName customer projectType status startDate endDate totalAmount products Progress');

        const formattedProjects = await Promise.all(projects.map(async project => {
            const projectProducts = await GaapProjectProduct.find({ project: project._id })
                .select('name description quantity price turnoverRange timeDeadline');

            const { _id, projectName, customer, projectType, status, startDate, endDate, totalAmount,Progress } = project;
            return {
                _id,
                projectName,
                Progress,
                customer: customer.name,
                projectType,
                status,
                startDate,
                endDate,
                totalAmount,
                assignedTo: project.assignedTo.name,
                salesPerson: project.salesPerson.name,
                products: projectProducts.map(prod => ({
                    name: prod.name,
                    description: prod.description,
                    quantity: prod.quantity,
                    price: prod.price,
                    turnoverRange: prod.turnoverRange,
                    timeDeadline: prod.timeDeadline
                }))
            };
        }));

        res.json(formattedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }
};




const updateProject = async (req, res) => {
    try {
        const projectId = req.body.projectId;
        const {
            projectName,
            customerId,
            projectType,
            department,
            Progress,
            assignedToId,
            salesPersonId,
            startDate,
            endDate,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            discountApprovedById,
            products,
            vatDetails
        } = req.body;

        const existingProject = await GaapProject.findById(projectId);
        if (!existingProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (customerId) {
            const customer = await GaapCustomer.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
        }

        if (assignedToId || salesPersonId) {
            const [assignedTo, salesPerson] = await Promise.all([
                assignedToId ? GaapUser.findById(assignedToId) : Promise.resolve(null),
                salesPersonId ? GaapUser.findById(salesPersonId) : Promise.resolve(null)
            ]);
            if ((assignedToId && !assignedTo) || (salesPersonId && !salesPerson)) {
                return res.status(404).json({ message: 'Assigned user or sales person not found' });
            }
        }

        let vatCertificateUrl = existingProject.vatDetails?.vatCertificate || '';
        if (req.files && req.files.vatCertificate) {
            const vatCertificateFile = req.files.vatCertificate[0];
            vatCertificateUrl = await uploadFileToFirebase(vatCertificateFile.buffer, vatCertificateFile.originalname);
        }

        let updatedDocuments = existingProject.documents || [];
        if (req.files && req.files.documents) {
            for (const doc of req.files.documents) {
                const url = await uploadFileToFirebase(doc.buffer, doc.originalname);
                updatedDocuments.push({
                    name: doc.originalname,
                    url: url,
                    uploadedBy: req.adminId,
                    uploadDate: new Date()
                });
            }
        }

        const updateData = {
            projectName,
            Progress,
            customer: customerId,
            projectType,
            department,
            assignedTo: assignedToId,
            salesPerson: salesPersonId,
            startDate,
            endDate,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            discountApprovedBy: discountApprovedById,
            vatDetails: {
                ...vatDetails,
                vatCertificate: vatCertificateUrl
            },
            documents: updatedDocuments,
            lastUpdatedBy: req.adminId
        };

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedProject = await GaapProject.findByIdAndUpdate(projectId, updateData, { new: true, runValidators: true });

        if (products && Array.isArray(products)) {
            await GaapProjectProduct.deleteMany({ project: projectId });

            const projectProducts = await Promise.all(products.map(async (product) => {
                const projectProduct = new GaapProjectProduct({
                    project: projectId,
                    name: product.name,
                    category: product.category,
                    subCategory: product.subCategory,
                    department: product.department,
                    priceType: product.priceType,
                    price: product.price,
                    quantity: product.quantity,
                    timeDeadline: product.timeDeadline,
                    turnoverRange: product.turnoverRange,
                    isVatProduct: product.isVatProduct
                });

                await projectProduct.save();
                return projectProduct._id;
            }));

            updatedProject.products = projectProducts;
            await updatedProject.save();
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};



const deleteProject = async (req, res) => {
    try {
        const projectId = req.body.projectId;

        const session = await GaapProject.startSession();
        session.startTransaction();

        try {
            const deletedProject = await GaapProject.findByIdAndDelete(projectId).session(session);
            if (!deletedProject) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Project not found' });
            }

            await GaapProjectProduct.deleteMany({ project: projectId }).session(session);

            await session.commitTransaction();
            session.endSession();

            res.json({ message: 'Project and associated products deleted successfully' });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};


const getAllProjectsWithComments = async (req, res) => {
    try {
        if (req.role !== 'Sales Executive') {
            return res.status(403).json({ message: 'Access denied. Only sales executives can view projects.' });
        }
        const projects = await GaapProject.find({ createdBy: req.adminId })
            .populate('customer', 'name')
            .populate('assignedTo', 'name')
            .populate('salesPerson', 'name')
            .lean();

        const projectIds = projects.map(project => project._id);
        const allComments = await GaapComment.find({ project: { $in: projectIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'name role')
            .lean();

        const commentsByProject = allComments.reduce((acc, comment) => {
            if (!acc[comment.project]) {
                acc[comment.project] = [];
            }
            acc[comment.project].push(comment);
            return acc;
        }, {});

        const projectsWithComments = projects.map(project => ({
            ...project,
            comments: commentsByProject[project._id] || []
        }));

        res.json(projectsWithComments);
    } catch (error) {
        console.error('Error fetching all projects with comments:', error);
        res.status(500).json({ message: 'Error fetching all projects with comments', error: error.message });
    }
};


module.exports = { createProject, getProjects, updateProject, deleteProject, getAllProjectsWithComments }