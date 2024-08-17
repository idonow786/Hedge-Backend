const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice'); 
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const mongoose = require('mongoose');

const getAllProjectsWithPayments = async (req, res) => {
    try {
        // Fetch all projects and populate relevant fields
        const projectQuery = GaapProject.find()
            .populate('customer', 'name companyName')
            .populate('assignedTo')
            .populate('salesPerson');

        const projects = await projectQuery.lean();

        // Fetch all project payments
        const projectPayments = await ProjectPayment.find().lean();

        // Fetch all invoices
        const invoices = await GaapInvoice.find().lean();

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

            return {
                ...project,
                payment: payment ? {
                    totalAmount: payment.totalAmount,
                    paidAmount: payment.paidAmount,
                    unpaidAmount: payment.unpaidAmount,
                    paymentStatus: payment.paymentStatus,
                    paymentProgress: (payment.paidAmount / payment.totalAmount) * 100,
                    lastPaymentDate: payment.lastPaymentDate,
                    nextPaymentDue: payment.nextPaymentDue,
                    paymentSchedule: payment.paymentSchedule
                } : null,
                invoices: projectInvoices.map(invoice => ({
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate,
                    dueDate: invoice.dueDate,
                    total: invoice.total,
                    status: invoice.status,
                    amountDue: invoice.total - (invoice.payments ? invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0)
                })),
                invoiceStatus: getInvoiceStatus(projectInvoices, project.totalAmount),
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

const getInvoiceStatus = (invoices, totalAmount) => {
    if (!invoices || invoices.length === 0) return 'Not Invoiced';
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    if (totalInvoiced >= totalAmount) return 'Fully Invoiced';
    if (totalInvoiced > 0) return 'Partially Invoiced';
    return 'Not Invoiced';
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
