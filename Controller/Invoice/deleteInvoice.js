const Invoice = require('../../Model/Invoices');

const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const adminId = req.user.adminId;

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, AdminID: adminId });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or not authorized' });
    }

    const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);

    res.status(200).json({
      message: 'Invoice deleted successfully',
      invoice: deletedInvoice,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { deleteInvoice };
