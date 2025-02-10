const GaapCustomer = require("../../../../Model/Gaap/gaap_customer");
const GaapTeam = require("../../../../Model/Gaap/gaap_team");
const GaapUser = require("../../../../Model/Gaap/gaap_user");
const GaapProject = require("../../../../Model/Gaap/gaap_project");
const ProjectPayment = require("../../../../Model/Gaap/gaap_projectPayment");
const GaapInvoice = require("../../../../Model/Gaap/gaap_invoice");

const getAllCustomersByAdmin = async (req, res) => {
  try {
    const { adminId, role } = req;
    let customers;
    let query = {};

    // Determine the query based on role
    if (role === "admin" || role === "Audit Manager") {
      const team = await GaapTeam.findOne({
        $or: [
          { "parentUser.userId": adminId },
          { "GeneralUser": { $elemMatch: { userId: adminId } } }
,
        ],
      });

      if (!team) {
        return res.status(404).json({ message: "Team not found for this admin/manager" });
      }

      // Build query based on role
      query = { teamId: team._id };

      // Only add branchId for Audit Manager or if admin has specific branch
      const isParentUser = team.parentUser.userId === adminId;
      if (!isParentUser) {
        const user = await GaapUser.findById(adminId);
        if (user && user.branchId) {
          query.branchId = user.branchId;
        }
      }
    } else {
      const managerTeam = await GaapTeam.findOne({
        "members.managerId": adminId,
      });
      if (managerTeam) {
        const teamMemberIds = [
          ...managerTeam.members.map((member) => member.memberId),
          adminId,
        ];
        query = {
          $or: [
            { registeredBy: { $in: teamMemberIds } },
            { registeredBy: adminId },
          ],
        };
      } else {
        query = { registeredBy: adminId };
      }
    }

    // Fetch customers with basic info
    customers = await GaapCustomer.find(query).sort({ createdAt: -1 }).lean();

    // Enhance customer data with financial information
    const enhancedCustomers = await Promise.all(
      customers.map(async (customer) => {
        // Get all projects for this customer
        const projects = await GaapProject.find({
          customer: customer._id,
        }).lean();

        const projectIds = projects.map((project) => project._id);

        // Get all payments and invoices
        const [payments, invoices] = await Promise.all([
          ProjectPayment.find({
            project: { $in: projectIds },
          }).lean(),
          GaapInvoice.find({
            project: { $in: projectIds },
          }).lean(),
        ]);

        // Calculate project totals
        const projectTotals = projects.reduce(
          (acc, project) => {
            return {
              totalAmount: acc.totalAmount + (project.totalAmount || 0),
              totalProjects: acc.totalProjects + 1,
              completedProjects:
                acc.completedProjects +
                (project.status === "Completed" ? 1 : 0),
              inProgressProjects:
                acc.inProgressProjects +
                (project.status === "In Progress" ? 1 : 0),
              proposedProjects:
                acc.proposedProjects + (project.status === "Proposed" ? 1 : 0),
            };
          },
          {
            totalAmount: 0,
            totalProjects: 0,
            completedProjects: 0,
            inProgressProjects: 0,
            proposedProjects: 0,
          }
        );

        // Calculate payment totals
        const paymentTotals = payments.reduce(
          (acc, payment) => {
            return {
              totalPaid: acc.totalPaid + (payment.paidAmount || 0),
              totalApproved: acc.totalApproved + (payment.approvalAmount || 0),
            };
          },
          {
            totalPaid: 0,
            totalApproved: 0,
          }
        );

        // Calculate invoice totals
        const invoiceTotals = invoices.reduce((acc, invoice) => {
          return acc + (invoice.total || 0);
        }, 0);

        // Get latest payment and invoice
        const sortedPayments = payments.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        const sortedInvoices = invoices.sort(
          (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
        );

        const totalUnpaid = projectTotals.totalAmount - paymentTotals.totalPaid;

        return {
          ...customer,
          financials: {
            totalAmount: projectTotals.totalAmount,
            totalPaid: paymentTotals.totalPaid,
            totalUnpaid: totalUnpaid,
            totalInvoiced: invoiceTotals,
            totalApproved: paymentTotals.totalApproved,
            paymentStatus: getPaymentStatus(
              paymentTotals.totalPaid,
              projectTotals.totalAmount
            ),
            lastPaymentDate: sortedPayments[0]?.createdAt || null,
            lastInvoiceDate: sortedInvoices[0]?.issueDate || null,
          },
          projects: {
            total: projectTotals.totalProjects,
            completed: projectTotals.completedProjects,
            inProgress: projectTotals.inProgressProjects,
            proposed: projectTotals.proposedProjects,
          },
          activeProjects: projectTotals.inProgressProjects,
          lastInteractionDate:
            customer.lastInteractionDate || customer.updatedAt,
        };
      })
    );

    // Calculate overall statistics
    const overallStats = enhancedCustomers.reduce(
      (stats, customer) => {
        return {
          totalCustomers: stats.totalCustomers + 1,
          totalAmount: stats.totalAmount + customer.financials.totalAmount,
          totalPaid: stats.totalPaid + customer.financials.totalPaid,
          totalUnpaid: stats.totalUnpaid + customer.financials.totalUnpaid,
          totalApproved:
            stats.totalApproved + customer.financials.totalApproved,
          totalInvoiced:
            stats.totalInvoiced + customer.financials.totalInvoiced,
          totalProjects: stats.totalProjects + customer.projects.total,
          activeProjects: stats.activeProjects + customer.activeProjects,
          fullyPaidCustomers:
            stats.fullyPaidCustomers +
            (customer.financials.paymentStatus === "Fully Paid" ? 1 : 0),
          partiallyPaidCustomers:
            stats.partiallyPaidCustomers +
            (customer.financials.paymentStatus === "Partially Paid" ? 1 : 0),
          unpaidCustomers:
            stats.unpaidCustomers +
            (customer.financials.paymentStatus === "Not Paid" ? 1 : 0),
        };
      },
      {
        totalCustomers: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalApproved: 0,
        totalInvoiced: 0,
        totalProjects: 0,
        activeProjects: 0,
        fullyPaidCustomers: 0,
        partiallyPaidCustomers: 0,
        unpaidCustomers: 0,
      }
    );

    res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      stats: overallStats,
      customers: enhancedCustomers,
    });
  } catch (error) {
    console.error("Error in getAllCustomersByAdmin:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching customers",
      error: error.message,
    });
  }
};

// Helper function to determine payment status
const getPaymentStatus = (paid, total) => {
  if (paid === 0) return "Not Paid";
  if (paid >= total) return "Fully Paid";
  return "Partially Paid";
};

module.exports = { getAllCustomersByAdmin };
