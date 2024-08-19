const GaapInvoice = require('../../../../Model/Gaap/gaap_invoice');
const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const mongoose = require('mongoose');
const GaapUser = require('../../../../Model/Gaap/gaap_user');


const addInvoice = async (req, res) => {
  try {
    const { projectId, invoiceDetails } = req.body;

    // Find the project
    const project = await GaapProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const user=await GaapUser.findById(req.adminId)

    // Create a new invoice object
    const newInvoice = new GaapInvoice({
      ...invoiceDetails,
      customer: project.customer,
      project: projectId,
      createdBy: req.adminId,
      teamId:user.teamId
    });
    // Validate the invoice
    const validationError = newInvoice.validateSync();
    if (validationError) {
      return res.status(400).json({ message: 'Invalid invoice data', errors: validationError.errors });
    }
    
    // Save the invoice
    await newInvoice.save();
    console.log(newInvoice)

    // Update the project with the new invoice
    project.invoices.push(newInvoice._id);
    await project.save();
    console.log(project)
    // Update or create ProjectPayment
    let projectPayment = await ProjectPayment.findOne({ project: projectId });
    
    if (!projectPayment) {
      projectPayment = new ProjectPayment({
        project: projectId,
        customer: project.customer,
        totalAmount: project.totalAmount,
        createdBy: req.adminId
      });
    }

    // Update ProjectPayment
    projectPayment.invoices.push(newInvoice._id);
    projectPayment.totalAmount = Math.max(projectPayment.totalAmount, newInvoice.total);
    projectPayment.unpaidAmount = projectPayment.totalAmount - projectPayment.paidAmount;

    // Add to payment schedule if not already included
    const existingSchedule = projectPayment.paymentSchedule.find(
      schedule => schedule.dueDate.getTime() === newInvoice.dueDate.getTime()
    );

    if (!existingSchedule) {
      projectPayment.paymentSchedule.push({
        dueDate: newInvoice.dueDate,
        amount: newInvoice.total,
        status: 'Pending'
      });
    } else {
      existingSchedule.amount += newInvoice.total;
    }

    projectPayment.updatePaymentStatus();
    await projectPayment.save();

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: newInvoice,
      projectPayment: projectPayment
    });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ message: 'Error adding invoice', error: error.message });
  }
};

module.exports = {
  addInvoice
};
