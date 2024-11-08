const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');

const getAllCustomersByAdmin = async (req, res) => {
    try {
        const { adminId, role } = req;
        let customers;
        let query = {};

        // Determine the query based on role
        if (role === 'admin' || role === 'Operation Manager') {
            const parentTeam = await GaapTeam.findOne({
                $or: [
                    { 'parentUser.userId': adminId },
                    { 'GeneralUser.userId': adminId },
                    { 'members.managerId': adminId }
                ]
            });
            if (parentTeam) {
                query = { teamId: parentTeam._id };
            }
        } else if (role === 'Finance Manager') {
            const user = await GaapUser.findById(adminId);
            if (user) {
                query = { teamId: user.teamId };
            }
        } else {
            const managerTeam = await GaapTeam.findOne({ 'members.managerId': adminId });
            if (managerTeam) {
                const teamMemberIds = [...managerTeam.members.map(member => member.memberId), adminId];
                query = {
                    $or: [
                        { registeredBy: { $in: teamMemberIds } },
                        { registeredBy: adminId }
                    ]
                };
            } else {
                query = { registeredBy: adminId };
            }
        }

        // Fetch customers with basic info
        customers = await GaapCustomer.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Enhance customer data with financial information
        const enhancedCustomers = await Promise.all(customers.map(async (customer) => {
            // Get all projects for this customer
            const projects = await GaapProject.find({ customer: customer._id });
            const projectIds = projects.map(project => project._id);

            // Get all payments for these projects
            const payments = await ProjectPayment.find({
                project: { $in: projectIds }
            });

            // Get all invoices for these projects
            const invoices = await GaapInvoice.find({
                project: { $in: projectIds }
            });

            // Calculate totals
            const totalAmount = projects.reduce((sum, project) => sum + (project.totalAmount || 0), 0);
            const totalPaid = payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
            const totalUnpaid = totalAmount - totalPaid;
            const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

            // Calculate project statistics
            const projectStats = {
                total: projects.length,
                completed: projects.filter(p => p.status === 'Completed').length,
                inProgress: projects.filter(p => p.status === 'In Progress').length,
                proposed: projects.filter(p => p.status === 'Proposed').length
            };

            // Get latest payment and invoice
            const latestPayment = payments.sort((a, b) => b.createdAt - a.createdAt)[0];
            const latestInvoice = invoices.sort((a, b) => b.createdAt - a.createdAt)[0];

            return {
                ...customer,
                financials: {
                    totalAmount,
                    totalPaid,
                    totalUnpaid,
                    totalInvoiced,
                    paymentStatus: totalPaid === totalAmount ? 'Fully Paid' : 
                                 totalPaid === 0 ? 'Not Paid' : 'Partially Paid',
                    lastPaymentDate: latestPayment?.createdAt || null,
                    lastInvoiceDate: latestInvoice?.issueDate || null
                },
                projects: projectStats,
                activeProjects: projects.filter(p => p.status === 'In Progress').length,
                lastInteractionDate: customer.lastInteractionDate || customer.updatedAt
            };
        }));

        // Calculate overall statistics
        const overallStats = enhancedCustomers.reduce((stats, customer) => {
            return {
                totalCustomers: stats.totalCustomers + 1,
                totalAmount: stats.totalAmount + customer.financials.totalAmount,
                totalPaid: stats.totalPaid + customer.financials.totalPaid,
                totalUnpaid: stats.totalUnpaid + customer.financials.totalUnpaid,
                totalProjects: stats.totalProjects + customer.projects.total,
                activeProjects: stats.activeProjects + customer.activeProjects
            };
        }, {
            totalCustomers: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalUnpaid: 0,
            totalProjects: 0,
            activeProjects: 0
        });

        res.status(200).json({
            success: true,
            message: 'Customers fetched successfully',
            stats: overallStats,
            customers: enhancedCustomers
        });

    } catch (error) {
        console.error('Error in getAllCustomersByAdmin:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching customers',
            error: error.message
        });
    }
};

module.exports = { getAllCustomersByAdmin };