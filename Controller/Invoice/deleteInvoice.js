const Invoice = require('../../Model/Invoices');
const Wallet = require('../../Model/Wallet');

const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const adminId = req.adminId;

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, AdminID: adminId });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or not authorized' });
    }

    const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);

    const invoiceMonth = new Date(deletedInvoice.InvoiceDate).getMonth();
    const invoiceYear = new Date(deletedInvoice.InvoiceDate).getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: new Date(invoiceYear, invoiceMonth, 1),
    });

    if (wallet) {
      if (deletedInvoice.Status === 'paid') {
        wallet.PaidInvoices = (parseInt(wallet.PaidInvoices) - 1).toString();
        wallet.TotalSales = (parseInt(wallet.TotalSales) - 1).toString();
        wallet.TotalRevenue = (parseFloat(wallet.TotalRevenue) - parseFloat(deletedInvoice.SubTotal)).toString();
        wallet.Earnings = (parseFloat(wallet.Earnings) - parseFloat(deletedInvoice.InvoiceTotal)).toString();
      } else {
        wallet.UnPaidInvoices = (parseInt(wallet.UnPaidInvoices) - 1).toString();
      }

      await wallet.save();
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

module.exports = { deleteInvoice };
