const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');

const getUnpaidProjects = async (req, res) => {
  try {
    const projects = await GaapProject.find({
      status: 'In Progress',
    }).populate('customer', 'name')
      .populate('assignedTo', 'name')
      .populate('salesPerson', 'name')
      .lean();
      console.log(projects)
      const projectsWithPayments = await Promise.all(projects.map(async (project) => {
        const payment = await ProjectPayment.findOne({ project: project._id })
        .populate('invoices')
        .lean();
        
        if (!payment || payment.paymentStatus !== 'Fully Paid') {
          return {
            ...project,
            payment: payment || { paymentStatus: 'Not Started', paidAmount: 0, unpaidAmount: project.totalAmount },
            unpaidInvoices: payment ? payment.invoices.filter(inv => inv.status !== 'Paid') : []
          };
        }
        return null;
      }));
      console.log(projectsWithPayments)

    const unpaidProjects = projectsWithPayments.filter(Boolean);

    res.status(200).json(unpaidProjects);
  } catch (error) {
    console.error('Error fetching unpaid projects:', error);
    res.status(500).json({ message: 'Error fetching unpaid projects', error: error.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const { projectId, paymentType, amount } = req.body;

    const project = await GaapProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let payment = await ProjectPayment.findOne({ project: projectId });
    if (!payment) {
      payment = new ProjectPayment({
        project: projectId,
        customer: project.customer,
        totalAmount: project.totalAmount,
        createdBy: req.adminId
      });
    }

    let paidAmount;
    if (paymentType === 'fully') {
      paidAmount = payment.totalAmount - payment.paidAmount;
    } else if (paymentType === 'partially') {
      paidAmount = parseFloat(amount);
      if (isNaN(paidAmount) || paidAmount <= 0 || paidAmount > payment.unpaidAmount) {
        return res.status(400).json({ message: 'Invalid payment amount' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    payment.addPayment(paidAmount, new Date(), 'Bank Transfer', req.adminId, 'Payment update by finance manager');

    // Generate new invoice
    const newInvoice = new GaapInvoice({
      invoiceNumber: `INV-${Date.now()}`,
      customer: project.customer,
      project: projectId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      items: [{
        description: `Payment for project ${project.projectName}`,
        quantity: 1,
        unitPrice: paidAmount,
        amount: paidAmount
      }],
      subtotal: paidAmount,
      total: paidAmount,
      status: 'Paid',
      createdBy: req.adminId
    });

    await newInvoice.save();

    payment.invoices.push(newInvoice._id);
    await payment.save();

    // Update project status if fully paid
    if (payment.paymentStatus === 'Fully Paid') {
      project.status = 'Completed';
      await project.save();
    }

    res.status(200).json({
      message: 'Payment updated successfully',
      payment: {
        totalAmount: payment.totalAmount,
        paidAmount: payment.paidAmount,
        unpaidAmount: payment.unpaidAmount,
        paymentStatus: payment.paymentStatus,
        lastPaymentDate: payment.lastPaymentDate,
        nextPaymentDue: payment.nextPaymentDue
      },
      newInvoice: {
        invoiceNumber: newInvoice.invoiceNumber,
        amount: newInvoice.total,
        status: newInvoice.status
      }
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};

const getProjectsWithPaymentStatus = async (req, res) => {
  try {
    const projects = await GaapProject.find({
      status: { $in: ['Approved', 'In Progress'] }
    }).populate('customer', 'name')
      .populate('assignedTo', 'name')
      .populate('salesPerson', 'name');

    const projectsWithPayments = await Promise.all(projects.map(async (project) => {
      const payment = await ProjectPayment.findOne({ project: project._id })
        .populate('invoices');

      if (!payment || payment.paymentStatus !== 'Fully Paid') {
        return {
          projectId: project._id,
          projectName: project.projectName,
          customerName: project.customer.name,
          assignedTo: project.assignedTo.name,
          salesPerson: project.salesPerson.name,
          totalAmount: payment ? payment.totalAmount : project.totalAmount,
          paidAmount: payment ? payment.paidAmount : 0,
          unpaidAmount: payment ? payment.unpaidAmount : project.totalAmount,
          paymentStatus: payment ? payment.paymentStatus : 'Not Started',
          lastPaymentDate: payment ? payment.lastPaymentDate : null,
          nextPaymentDue: payment ? payment.nextPaymentDue : null,
          invoices: payment ? payment.invoices.map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            amount: inv.total,
            status: inv.status
          })) : []
        };
      }
      return null;
    }));

    const filteredProjects = projectsWithPayments.filter(Boolean);

    res.status(200).json(filteredProjects);
  } catch (error) {
    console.error('Error fetching projects with payment status:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

module.exports={getUnpaidProjects,updatePayment,getProjectsWithPaymentStatus}