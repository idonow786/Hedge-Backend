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

    const paidAmount = paymentType === 'fully' ? payment.totalAmount : amount;
    payment.addPayment(paidAmount, new Date(), 'Bank Transfer', req.adminId, 'Payment update by finance manager');

    await payment.save();

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

    res.status(200).json({
      message: 'Payment updated successfully',
      payment: payment,
      newInvoice: newInvoice
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
};

module.exports={getUnpaidProjects,updatePayment}