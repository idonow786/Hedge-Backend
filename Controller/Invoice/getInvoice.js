const Invoice = require('../../Model/Invoices');
const Customer = require('../../Model/Customer');

const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.adminId
;

    let query = { AdminID: adminId };

    if (startDate && endDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.InvoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(startDate),
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
        { InvoiceTotal: searchNumber },
        { Amount: searchNumber },
        { 'From.Email': searchRegex },
        { 'To.Email': searchRegex },
        { 'From.Address': searchRegex },
        { 'To.Address': searchRegex },
      ];
    }

    const invoices = await Invoice.find(query).populate('CustomerId', 'Name PicUrl');

    const invoicesWithCustomerDetails = invoices.map((invoice) => {
      const { CustomerId, ...invoiceData } = invoice.toObject();
      const customerName = CustomerId ? CustomerId.Name : '';
      const customerPicUrl = CustomerId ? CustomerId.PicUrl : '';

      return {
        ...invoiceData,
        customerName,
        customerPicUrl,
      };
    });

    res.status(200).json({
      message: 'Invoices retrieved successfully',
      invoices: invoicesWithCustomerDetails,
    });
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getInvoices };
