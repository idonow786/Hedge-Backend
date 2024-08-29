const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice'); 
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');

const getAllProjectsWithPayments = async (req, res) => {
    try {
        const user = await GaapUser.findById(req.adminId);
        let TeamId
        console.log(user)
        if (!user) {
            return res.status(400).json({ message: 'user not found' });
        }
        if (req.role === 'admin' || req.role === 'Operation Manager') {
            // For admin and Operation Manager, find the team first
            const team = await GaapTeam.findOne({
                $or: [
                    { 'parentUser.userId': req.adminId },
                    { 'GeneralUser.userId': req.adminId }
                ]
            });

            if (!team) {
                return res.status(404).json({ message: 'Team not found for this admin/manager' });
            }

            // Use the team's _id to filter DSRs
            TeamId = team._id;
        }
        else{
            TeamId=user.teamId
        }
        // Fetch all projects for the user's team
        const projects = await GaapProject.find({ teamId: TeamId })
            .populate('customer', 'name companyName')
            .populate('assignedTo', 'fullName')
            .populate('salesPerson', 'fullName')
            .lean();

        // Fetch all project payments for these projects
        const projectIds = projects.map(p => p._id);
        const projectPayments = await ProjectPayment.find({ project: { $in: projectIds } }).lean();

        // Fetch all invoices for these projects
        const invoices = await GaapInvoice.find({ project: { $in: projectIds } }).lean();
        // Create maps for quick lookup
        const paymentMap = new Map(projectPayments.map(payment => [payment.project.toString(), payment]));
        const invoiceMap = new Map();
        invoices.forEach(invoice => {
            if (!invoiceMap.has(invoice.project.toString())) {
                invoiceMap.set(invoice.project.toString(), []);
            }
            invoiceMap.get(invoice.project.toString()).push(invoice);
        });

        // Combine project data with payment, invoice, and product data
        const projectsWithPayments = await Promise.all(projects.map(async (project) => {
            const payment = paymentMap.get(project._id.toString());
            const projectInvoices = invoiceMap.get(project._id.toString()) || [];
            
            // Fetch project products
            const projectProducts = await GaapProjectProduct.find({ project: project._id }).lean();

            // Calculate total amount from products if project.totalAmount is not set
            const calculatedTotalAmount = projectProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
            const totalAmount = project.totalAmount || calculatedTotalAmount;

            // Calculate total invoiced amount
            const totalInvoicedAmount = projectInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

            return {
                ...project,
                totalAmount, // Use calculated total if not set in project
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
                products: projectProducts.map(product => ({
                    name: product.name,
                    category: product.category,
                    subCategory: product.subCategory,
                    priceType: product.priceType,
                    price: product.price,
                    quantity: product.quantity,
                    timeDeadline: product.timeDeadline,
                    turnoverRange: product.turnoverRange
                }))
            };
        }));

        // Sort projects based on status and start date
        projectsWithPayments.sort((a, b) => {
            if (a.status === b.status) {
                return new Date(b.startDate) - new Date(a.startDate);
            }
            return getStatusPriority(a.status) - getStatusPriority(b.status);
        });

        // Group projects by status
        const groupedProjects = {
            ongoingProjects: projectsWithPayments.filter(p => ['Approved', 'In Progress'].includes(p.status)),
            pendingProjects: projectsWithPayments.filter(p => p.status === 'Proposed'),
            completedProjects: projectsWithPayments.filter(p => p.status === 'Completed'),
            cancelledProjects: projectsWithPayments.filter(p => p.status === 'Cancelled'),
            onHoldProjects: projectsWithPayments.filter(p => p.status === 'On Hold')
        };

        res.status(200).json({
            allProjects: projectsWithPayments,
            groupedProjects: groupedProjects
        });
    } catch (error) {
        console.error('Error fetching projects with payments:', error);
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

module.exports = { getAllProjectsWithPayments };