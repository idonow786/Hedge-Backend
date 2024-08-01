const Invoice = require('../../Model/Invoices');
const Project = require('../../Model/Project');
const ProjectC = require('../../Model/projectConstruction');
const Customer = require('../../Model/Customer');
const Business = require('../../Model/Business');

const getInvoices = async (req, res) => {
  try {
    const adminId = req.adminId; 

    const invoices = await Invoice.find({ AdminID: adminId }).populate('CustomerId');

    const invoicesWithDetails = await Promise.all(invoices.map(async (invoice) => {
      let project, customer, business;

      if (invoice.ProjectId) {
        project = await Project.findById(invoice.ProjectId) || await ProjectC.findById(invoice.ProjectId);
      }

      customer = invoice.CustomerId;

      const isProjectC = project && project.projectName; 

      let businessId;
      if (isProjectC) {
        businessId = project.adminId;
      } else if (project && project.BusinessID) {
        businessId = project.BusinessID;
      }

      if (businessId) {
        business = await Business.findById(businessId);
      }

      return {
        _id:invoice._id,
        ID: invoice.ID,
        OrderNumber: invoice.OrderNumber,
        PicUrl: invoice.PicUrl,
        InvoiceDate: invoice.InvoiceDate,
        Quantity: invoice.Quantity,
        Amount: invoice.Amount,
        ProjectId: invoice.ProjectId,
        Status: invoice.Status,
        InvoiceNumber: invoice.InvoiceNumber,
        SubTotal: invoice.SubTotal,
        Vat: invoice.Vat,
        InvoiceTotal: invoice.InvoiceTotal,
        Description: invoice.Description,
        ProjectDetails: project ? {
          ID: isProjectC ? project._id : project.ID,
          Title: isProjectC ? project.projectName : project.Title,
          Description: project.Description || project.projectDescription,
        } : null,
        CustomerDetails: customer ? {
          ID: customer.ID,
          Name: customer.Name,
          Email: customer.Email,
        } : null,
        BusinessDetails: business ? {
          ID: business.ID,
          BusinessName: business.BusinessName,
          BusinessEmail: business.BusinessEmail,
        } : null,
      };
    }));

    res.status(200).json({ invoices: invoicesWithDetails });
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    res.status(500).json({ message: 'Error retrieving invoices', error: error.message });
  }
};

module.exports = { getInvoices };
