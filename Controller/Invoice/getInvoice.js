const Invoice = require('../../Model/Invoices');
const Project = require('../../Model/Project');
const Customer = require('../../Model/Customer');
const Business = require('../../Model/Business');

const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.adminId;

    let query = { AdminID: adminId };

    if (startDate && endDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      query.InvoiceDate = {
        $lte: new Date(endDate),
      };
    }

    if (search) {
      let searchRegex = { $regex: search, $options: 'i' };
      let searchNumber = isNaN(Number(search)) ? 0 : Number(search);

      query.$or = [
        { ID: searchNumber },
        { InvoiceTotal: searchNumber },
        { Amount: searchNumber },
        { OrderNumber: searchRegex },
        { InvoiceNumber: searchRegex },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('CustomerId', 'Name')
      .populate('ProjectId', 'Title')
      .lean();

    const invoicesWithDetails = await Promise.all(
      invoices.map(async (invoice) => {
        const project = await Project.findById(invoice.ProjectId).populate('BusinessID', 'Name');
        const customer = await Customer.findById(invoice.CustomerId);
        const business = await Business.findById(project.BusinessID);

        return {
          ...invoice,
          Project: project,
          Customer: customer,
          Business: business,
        };
      })
    );

    res.status(200).json({
      message: 'Invoices retrieved successfully',
      invoices: invoicesWithDetails,
    });
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getInvoices };
