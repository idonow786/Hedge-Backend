const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');
const { uploadFileToFirebase } = require('../../../../Firebase/uploadFileToFirebase');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapNotification = require('../../../../Model/Gaap/gaap_notification');
const GaapTeam = require('../../../../Model/Gaap/gaap_team')
const FixedPriceProduct = require('../../../../Model/Gaap/gaap_fixed_price_product');
const GaapTask = require('../../../../Model/Gaap/gaap_task');
const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice'); 
const mongoose = require('mongoose');

const GaapDocument = require('../../../../Model/Gaap/gaap_document');
const createProject = async (req, res) => {
    try {
        const {
            projectName,
            customerId,
            projectType,
            department,
            startDate,
            endDate,
            description,
            status,
            pricingType,
            totalAmount,
            appliedDiscount,
            products,
            vatDetails,
            paymentPlan,
            approvalComments,
            recurring,
            RecurringDate,
            RecurringPaymentMethod,
            meetingDate,
            meetingTime,
            meetingVenue,
            meetingComment,
        } = req.body;

        console.log(req.body);
        console.log(req.files);

        if (!projectName || !customerId || !projectType || !pricingType || !totalAmount || !products) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await GaapUser.findById(req.adminId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const customer = await GaapCustomer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        let projectStartDate, projectEndDate;
        if (pricingType === 'Fixed') {
            const fixedPriceProduct = await FixedPriceProduct.findOne({
                auditType: projectType,
                amount: totalAmount
            });

            if (!fixedPriceProduct) {
                return res.status(404).json({ message: 'Fixed price product not found' });
            }

            const timeDeadlineMatch = fixedPriceProduct.timeDeadline.match(/(\d+)\s*days?/i);
            if (!timeDeadlineMatch) {
                return res.status(400).json({ message: 'Invalid time deadline format in fixed price product' });
            }

            const timeDeadlineDays = parseInt(timeDeadlineMatch[1]);
            if (isNaN(timeDeadlineDays)) {
                return res.status(400).json({ message: 'Invalid time deadline in fixed price product' });
            }

            projectStartDate = new Date();
            projectEndDate = new Date(projectStartDate.getTime() + timeDeadlineDays * 24 * 60 * 60 * 1000);
        } else if (pricingType === 'Variable') {
            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Start and end dates are required for variable pricing' });
            }
            projectStartDate = new Date(startDate);
            projectEndDate = new Date(endDate);
        } else {
            return res.status(400).json({ message: 'Invalid pricing type' });
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

        // Get the last project to determine the next number
        const lastProject = await GaapProject.findOne({}, {}, { sort: { 'createdAt': -1 } });
        let nextNumber = 100001;

        if (lastProject && lastProject.projectGaapId) {
            // Extract the number from the last project ID
            const lastNumber = parseInt(lastProject.projectGaapId.split('/').pop());
            nextNumber = lastNumber + 1;
        }

        // Create the project ID format with larger number: GAAP/UserFullName/100001
        const projectGaapId = `GAAP/${user.fullName.toUpperCase()}/${nextNumber}`;

        const newProject = new GaapProject({
            projectGaapId,
            projectName,
            customer: customerId,
            projectType,
            department,
            paymentPlan,
            assignedTo: req.adminId,
            startDate: projectStartDate,
            endDate: projectEndDate,
            status,
            description,
            teamId: user.teamId,
            pricingType,
            totalAmount,
            appliedDiscount,
            vatDetails: {
                ...vatDetails,
                vatCertificate: vatCertificateUrl
            },
            documents: documents,
            createdBy: req.adminId,
            ...(recurring && { recurring }),
            ...(RecurringDate && { RecurringDate: new Date(RecurringDate) }),
            ...(RecurringPaymentMethod && { RecurringPaymentMethod }),
            meetingDetails: {
                ...(meetingDate && { meetingDate: new Date(meetingDate) }),
                ...(meetingTime && { meetingTime }),
                ...(meetingVenue && { meetingVenue }),
                ...(meetingComment && { meetingComment })
            },
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

        // Create notification for new project
        const notification = new GaapNotification({
            user: req.adminId,
            message: `New project "${projectName}" has been created.`,
            department: department,
            teamId: user.teamId,
            type: 'Project',
            projectId: newProject._id,
            status: 'unread'
        });
        await notification.save();

        console.log(newProject);

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

    // Determine the projects to fetch based on user role
    if (req.role === 'admin' || req.role === 'Operation Manager') {
      const team = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': req.adminId },
          { 'GeneralUser.userId': req.adminId }
        ]
      });

      if (team) {
        projects = await GaapProject.find({ teamId: team._id })
          .populate('customer')
          .populate('assignedTo', 'fullName')
          .populate('salesPerson', 'fullName')
          .populate('tasks')
          .populate('discountApprovedBy')
          .populate('invoices')
          .populate('payments')
          .populate('createdBy')
          .populate('lastUpdatedBy')
          .lean();
      } else {
        projects = []; // No team found, return empty array
      }
    } else {
      projects = await GaapProject.find({ createdBy: req.adminId })
        .populate('customer')
        .populate('assignedTo', 'fullName')
        .populate('salesPerson', 'fullName')
        .populate('tasks')
        .populate('discountApprovedBy')
        .populate('invoices')
        .populate('payments')
        .populate('createdBy')
        .populate('lastUpdatedBy')
        .lean();
    }

    if (!projects || projects.length === 0) {
      // No projects found, return empty response
      return res.status(200).json({
        allProjects: [],
        groupedProjects: {
          ongoingProjects: [],
          pendingProjects: [],
          completedProjects: [],
          cancelledProjects: [],
          onHoldProjects: []
        }
      });
    }

    const projectIds = projects.map(p => p._id);

    // Fetch related data in parallel
    const [projectPayments, invoices, projectDocuments] = await Promise.all([
      ProjectPayment.find({ project: { $in: projectIds } }).lean(),
      GaapInvoice.find({ project: { $in: projectIds } }).lean(),
      GaapDocument.find({ project: { $in: projectIds } })
        .populate('uploadedBy', 'fullName') // Populate uploadedBy if needed
        .lean()
    ]);

    // Map payments by project ID
    const paymentMap = new Map(projectPayments.map(payment => [payment.project.toString(), payment]));

    // Map invoices by project ID
    const invoiceMap = new Map();
    invoices.forEach(invoice => {
      const projectId = invoice.project.toString();
      if (!invoiceMap.has(projectId)) {
        invoiceMap.set(projectId, []);
      }
      invoiceMap.get(projectId).push(invoice);
    });

    // Map documents by project ID
    const documentMap = new Map();
    projectDocuments.forEach(document => {
      const projectId = document.project.toString();
      if (!documentMap.has(projectId)) {
        documentMap.set(projectId, []);
      }
      documentMap.get(projectId).push({
        documentType: document.documentType,
        filePath: document.filePath,
        uploadedBy: document.uploadedBy ? document.uploadedBy.fullName : null,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      });
    });
    // Format each project
    // Format each project
    const formattedProjects = await Promise.all(projects.map(async project => {
      // Fetch products related to the project
      const projectProducts = await GaapProjectProduct.find({ project: project._id }).lean();

      // Fetch payment information
      const payment = paymentMap.get(project._id.toString());

      // Fetch invoices related to the project
      const projectInvoices = invoiceMap.get(project._id.toString()) || [];

      // Calculate the total amount
      const calculatedTotalAmount = projectProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      const totalAmount = project.totalAmount || calculatedTotalAmount;

      // Calculate the total invoiced amount
      const totalInvoicedAmount = projectInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

      // Calculate progress based on completed tasks
      console.log(project._id)
      const tasks = await GaapTask.find({ project: new mongoose.Types.ObjectId(project._id) });
      const totalTasks = tasks.length;
      console.log(totalTasks)
      const completedTasks = tasks.filter(task => task.status === 'Completed').length;
      console.log('C: ',completedTasks)
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      console.log('P: ',progress)
      let paymentM = await ProjectPayment.findOne({ project: project._id });

      // Update project status if necessary
      if (progress >= 100 && project.status !== 'Completed'&&paymentM.paymentStatus === 'Fully Paid') {
        await GaapProject.findByIdAndUpdate(project._id, { status: 'Completed' });
        project.status = 'Completed';
        const notificationMessage = `Project "${project.projectName}" have been completed.`;
        const notification = new GaapNotification({
          user: req.adminId,
          message: notificationMessage,
          department: project.department, 
        });

        await notification.save();
      }

      return {
        ...project,
        totalAmount,
        payment: payment ? {
          totalAmount: payment.totalAmount || totalAmount,
          paidAmount: payment.paidAmount || 0,
          unpaidAmount: (payment.totalAmount || totalAmount) - (payment.paidAmount || 0),
          paymentStatus: payment.paymentStatus || 'Not Started',
          paymentProgress: payment.totalAmount > 0 ? ((payment.paidAmount || 0) / payment.totalAmount) * 100 : 0,
          lastPaymentDate: payment.lastPaymentDate,
          nextPaymentDue: payment.nextPaymentDue,
          paymentSchedule: payment.paymentSchedule || [],
          paymentOption: payment.paymentOption || 'Not Set'
        } : {
          totalAmount,
          paidAmount: 0,
          unpaidAmount: totalAmount,
          paymentStatus: 'Not Started',
          paymentProgress: 0,
          paymentOption: 'Not Set'
        },
        invoices: projectInvoices.map(invoice => ({
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          total: invoice.total || 0,
          status: invoice.status || 'Sent',
          amountDue: (invoice.total || 0) - (invoice.payments ? invoice.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) : 0)
        })),
        invoiceStatus: getInvoiceStatus(totalInvoicedAmount, totalAmount),
        taskProgress:progress,
        products: projectProducts, // Include the full product model here
        documents: documentMap.get(project._id.toString()) || [] // Include documents
      };
    }));

    // Sort projects based on status priority and startDate
    formattedProjects.sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.startDate) - new Date(a.startDate);
      }
      return getStatusPriority(a.status) - getStatusPriority(b.status);
    });

    // Group projects by their status
    const groupedProjects = {
      ongoingProjects: formattedProjects.filter(p => ['Approved', 'In Progress'].includes(p.status)),
      pendingProjects: formattedProjects.filter(p => p.status === 'Proposed'),
      completedProjects: formattedProjects.filter(p => p.status === 'Completed'),
      cancelledProjects: formattedProjects.filter(p => p.status === 'Cancelled'),
      onHoldProjects: formattedProjects.filter(p => p.status === 'On Hold')
    };

    // Send the response
    res.status(200).json({
      allProjects: formattedProjects,
      groupedProjects: groupedProjects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};


const getInvoiceStatus = (totalInvoicedAmount, totalAmount) => {
  if (totalInvoicedAmount === 0) return 'Not Invoiced';
  if (totalInvoicedAmount >= totalAmount) return 'Fully Invoiced';
  return 'Partially Invoiced';
};

const getStatusPriority = (status) => {
  const priorities = {
      'In Progress': 1,
      'Approved': 2,
      'Proposed': 3,
      'On Hold': 4,
      'Completed': 5,
      'Cancelled': 6
  };
  return priorities[status] || 999; 
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
      paymentPlan,
      endDate,
      status,
      pricingType,
      totalAmount,
      appliedDiscount,
      description,
      discountApprovedById,
      operationsManagerApproval,
      products,
      approvalComments,
      vatDetails,
      recurring,
      RecurringDate,
      RecurringPaymentMethod,
      meetingDate,
      meetingTime,
      meetingVenue,
      meetingComment,
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
      description,
      assignedTo: assignedToId,
      salesPerson: salesPersonId,
      startDate,
      financialApproval,
      paymentPlan,
      customerApproval,
      salesManagerApproval,
      operationsManagerApproval,
      endDate,
      status,
      pricingType,
      totalAmount,
      vatDetails: {
        ...vatDetails,
        vatCertificate: vatCertificateUrl
      },
      documents: updatedDocuments,
      lastUpdatedBy: req.adminId,
      ...(recurring !== undefined && { recurring }),
      ...(RecurringDate && { RecurringDate: new Date(RecurringDate) }),
      ...(RecurringPaymentMethod && { RecurringPaymentMethod }),
      ...(meetingDate || meetingTime || meetingVenue || meetingComment ? {
        meetingDetails: {
          ...(existingProject.meetingDetails || {}),
          ...(meetingDate && { meetingDate: new Date(meetingDate) }),
          ...(meetingTime && { meetingTime }),
          ...(meetingVenue && { meetingVenue }),
          ...(meetingComment && { meetingComment })
        }
      } : {}),
    };

    const notificationsToCreate = [];

    // Update customer approval notification
    if (customerApproval !== existingProject.customerApproval) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Customer ${customerApproval ? 'approved' : 'unapproved'} project ${projectName}.`,
            teamId: existingProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
    }

    // Update sales manager approval notification
    if (salesManagerApproval !== existingProject.salesManagerApproval) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Sales Manager ${salesManagerApproval ? 'approved' : 'unapproved'} project ${projectName}.`,
            teamId: existingProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
    }

    // Update progress notification
    if (Progress !== existingProject.Progress) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Project ${projectName} progress updated to ${Progress}%.`,
            teamId: existingProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
    }

    // Update status notification
    if (status !== existingProject.status) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Project ${projectName} status changed to ${status}.`,
            teamId: existingProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
    }

    // Update approval comments notification
    if (approvalComments) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Sales Manager added approval comments for project ${projectName}.`,
            teamId: existingProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
    }

    // Update discount notification
    if (appliedDiscount >= 0) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Discount of ${appliedDiscount}% applied to project ${projectName}.`,
            teamId: existingProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
    }

    // Update tasks creation notification
    if (tasksToCreate && tasksToCreate.length > 0) {
        notificationsToCreate.push({
            user: req.adminId,
            message: `Tasks created for project ${updatedProject.projectName} based on project type.`,
            teamId: updatedProject.teamId,
            department: existingProject.department,
            type: 'Project',
            projectId: projectId,
            status: 'unread'
        });
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
