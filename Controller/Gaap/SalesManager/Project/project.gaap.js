const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProjectProduct = require('../../../../Model/Gaap/gaap_product');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');

const getProjectsAll = async (req, res) => {
  try {
    const { adminId, role } = req;
    let projects = [];

    if (role === 'admin' || role === 'Operation Manager') {
      const team = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': adminId },
          { 'GeneralUser.userId': adminId }
        ]
      });

      if (team) {
        projects = await GaapProject.find({ teamId: team._id });
      } else {
        projects = await GaapProject.find({ createdBy: adminId });
      }
    } else {
      const managerTeam = await GaapTeam.findOne({ 'members.managerId': adminId });
      if (managerTeam) {
        const teamMemberIds = managerTeam.members.map(member => member.memberId);
        teamMemberIds.push(adminId);
        projects = await GaapProject.find({
          $or: [
            { createdBy: { $in: teamMemberIds } },
            { createdBy: adminId }
          ]
        });
      } else {
        projects = await GaapProject.find({ createdBy: adminId });
      }
    }

    // Populate necessary fields
    projects = await GaapProject.populate(projects, [
      { path: 'customer' },
      { path: 'assignedTo', select: 'fullName' },
      { path: 'salesPerson', select: 'fullName' },
      { path: 'tasks' },
      { path: 'discountApprovedBy' },
      { path: 'invoices' },
      { path: 'payments' },
      { path: 'createdBy' },
      { path: 'lastUpdatedBy' }
    ]);

    const projectIds = projects.map(p => p._id);
    const projectPayments = await ProjectPayment.find({ project: { $in: projectIds } }).lean();
    const invoices = await GaapInvoice.find({ project: { $in: projectIds } }).lean();

    const paymentMap = new Map(projectPayments.map(payment => [payment.project.toString(), payment]));
    const invoiceMap = new Map();
    invoices.forEach(invoice => {
      if (!invoiceMap.has(invoice.project.toString())) {
        invoiceMap.set(invoice.project.toString(), []);
      }
      invoiceMap.get(invoice.project.toString()).push(invoice);
    });

    const formattedProjects = await Promise.all(projects.map(async project => {
      const projectProducts = await GaapProjectProduct.find({ project: project._id }).lean();
      const payment = paymentMap.get(project._id.toString());
      const projectInvoices = invoiceMap.get(project._id.toString()) || [];

      const calculatedTotalAmount = projectProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      const totalAmount = project.totalAmount || calculatedTotalAmount;
      const totalInvoicedAmount = projectInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'Completed').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      let paymentM = await ProjectPayment.findOne({ project: project._id });

      if (progress >= 100 && project.status !== 'Completed'&&paymentM.paymentStatus === 'Fully Paid') {
        project.status = 'Completed';
        await project.save();
      }

      return {
        ...project.toObject(),
        totalAmount,
        meetingDate: project.meetingDetails?.meetingDate || null,
        meetingTime: project.meetingDetails?.meetingTime || null,
        meetingVenue: project.meetingDetails?.meetingVenue || null,
        meetingComment: project.meetingDetails?.meetingComment || null,
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
        products: project.products, // Include the original products array
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

    formattedProjects.sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.startDate) - new Date(a.startDate);
      }
      return getStatusPriority(a.status) - getStatusPriority(b.status);
    });

    const groupedProjects = {
      ongoingProjects: formattedProjects.filter(p => ['Approved', 'In Progress'].includes(p.status)),
      pendingProjects: formattedProjects.filter(p => p.status === 'Proposed'),
      completedProjects: formattedProjects.filter(p => p.status === 'Completed'),
      cancelledProjects: formattedProjects.filter(p => p.status === 'Cancelled'),
      onHoldProjects: formattedProjects.filter(p => p.status === 'On Hold')
    };

    res.status(200).json({ allProjects: formattedProjects, groupedProjects: groupedProjects });
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

module.exports = { getProjectsAll };