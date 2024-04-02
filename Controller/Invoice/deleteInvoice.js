const Invoice = require('../../Model/Invoices');

const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);

    if (!deletedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({
      message: 'Invoice deleted successfully',
      invoice: deletedInvoice,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
module.exports={deleteInvoice}