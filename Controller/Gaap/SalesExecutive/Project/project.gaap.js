const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');
const { uploadFileToFirebase } = require('../../../../Firebase/uploadFileToFirebase');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapNotification = require('../../../../Model/Gaap/gaap_notification');
const GaapTeam=require('../../../../Model/Gaap/gaap_team')

const createProject = async (req, res) => {
    try {
        const {
            projectName,
            customerId,
            projectType,
            department,
            startDate,
            endDate,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            products,
            vatDetails,
            approvalComments,
        } = req.body;

        if (!projectName || !customerId || !projectType || !startDate || !pricingType || !totalAmount || !products) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const user = await GaapUser.findById(req.adminId)

        const customer = await GaapCustomer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
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
            assignedTo: req.adminId,
            startDate,
            endDate,
            status,
            teamId: user.teamId,
            pricingType,
            totalAmount,
            appliedDiscount,
            vatDetails: {
                ...vatDetails,
                vatCertificate: vatCertificateUrl
            },
            documents: documents,
            createdBy: req.adminId
        });

        // If the user is a Sales Manager, add approval and handle discount
        if (req.role === 'Sales Manager') {
            newProject.approvals.push({
                stage: 'Initial Approval',
                approvedBy: req.adminId,
                approvedDate: new Date(),
                comments: approvalComments
            });

            if (appliedDiscount > 0) {
                newProject.appliedDiscount = appliedDiscount;
                newProject.discountApprovedBy = req.adminId;
            }
        }

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

        // Create ProjectPayment document
        const newProjectPayment = new ProjectPayment({
            project: newProject._id,
            customer: customerId,
            totalAmount: totalAmount,
            paidAmount: 0,
            unpaidAmount: totalAmount,
            paymentSchedule: [],
            paymentStatus: 'Not Started',
            createdBy: req.adminId
        });

        await newProjectPayment.save();

        res.status(201).json({
            project: newProject,
            projectPayment: newProjectPayment
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};






const getProjects = async (req, res) => {
    try {
        let projects;
        // Find the team where the user is a parent

        if (req.role === 'admin' || req.role === 'General Manager') {
            const team = await GaapTeam.findOne({
                $or: [
                    { 'parent.userId': req.adminId },
                    { 'generalManager.userId': req.adminId }
                ]
            }); 
            if (team) {
                projects = await GaapProject.find({ teamId: team._id })
                    .populate('customer')
                    .populate('assignedTo')
                    .populate('salesPerson');
            }
        } else {

            projects = await GaapProject.find({ createdBy: req.adminId })
                .populate('customer')
                .populate('assignedTo')
                .populate('salesPerson')
        }
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
            financialApproval,
            customerApproval,
            salesManagerApproval,
            endDate,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            discountApprovedById,
            products,
            approvalComments,
            vatDetails
        } = req.body;

        const existingProject = await GaapProject.findById(projectId);
        if (!existingProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (customerId) {
            console.log(await GaapCustomer.find())
            const customer = await GaapCustomer.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
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
            financialApproval,
            customerApproval,
            salesManagerApproval,
            endDate,
            status,
            pricingType,
            totalAmount,
            vatDetails: {
                ...vatDetails,
                vatCertificate: vatCertificateUrl
            },
            documents: updatedDocuments,
            lastUpdatedBy: req.adminId
        };

        const notificationsToCreate = [];

        // Check for important changes and create notifications
        if (financialApproval !== existingProject.financialApproval) {
            notificationsToCreate.push({
                user: req.adminId,
                message: `Project ${projectName} has been ${financialApproval ? 'approved' : 'unapproved'} by finance.`,
            });
        }

        if (customerApproval !== existingProject.customerApproval) {
            notificationsToCreate.push({
                user: req.adminId,
                message: `Customer ${customerApproval ? 'approved' : 'unapproved'} project ${projectName}.`,
            });
        }

        if (salesManagerApproval !== existingProject.salesManagerApproval) {
            notificationsToCreate.push({
                user: req.adminId,
                message: `Sales Manager ${salesManagerApproval ? 'approved' : 'unapproved'} project ${projectName}.`,
            });
        }

        if (Progress !== existingProject.Progress) {
            notificationsToCreate.push({
                user: req.adminId,
                message: `Project ${projectName} progress updated to ${Progress}%.`,
            });
        }

        if (status !== existingProject.status) {
            notificationsToCreate.push({
                user: req.adminId,
                message: `Project ${projectName} status changed to ${status}.`,
            });
        }

        if (approvalComments) {
            updateData.approvals = [
                ...existingProject.approvals,
                {
                    stage: 'Update Approval',
                    approvedBy: req.adminId,
                    approvedDate: new Date(),
                    comments: approvalComments
                }
            ];
            notificationsToCreate.push({
                user: req.adminId,
                message: `Sales Manager added approval comments for project ${projectName}.`,
                teamId: existingProject.teamId
            });
        }

        if (appliedDiscount > 0) {
            updateData.appliedDiscount = appliedDiscount;
            updateData.discountApprovedBy = req.adminId;
            notificationsToCreate.push({
                user: req.adminId,
                message: `Discount of ${appliedDiscount}% applied to project ${projectName}.`,
                teamId: existingProject.teamId
            });
        }


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

            if (req.role === 'Sales Manager') {
                notificationsToCreate.push({
                    user: req.adminId,
                    message: `Products updated for project ${projectName}.`,
                    teamId: existingProject.teamId
                });
            }
        }

        // Create all notifications if the role is Sales Manager
        if (req.role === 'Sales Manager' && notificationsToCreate.length > 0) {
            await GaapNotification.insertMany(notificationsToCreate);
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
        let projects;
        if (req.role === 'admin') {
            projects = await GaapProject.find()
                .populate('customer', 'name')
                .populate('assignedTo', 'name')
                .populate('salesPerson', 'name')
                .lean();
        } else {
            projects = await GaapProject.find({ createdBy: req.adminId })
                .populate('customer', 'name')
                .populate('assignedTo', 'name')
                .populate('salesPerson', 'name')
                .lean();
        }


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