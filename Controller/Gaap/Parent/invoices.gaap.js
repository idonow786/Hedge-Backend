// gaapInvoiceController.js

const GaapInvoice = require('../../../Model/Gaap/gaap_invoice'); 

const gaapInvoiceController = {
  // Get all invoices
  getAllInvoices: async (req, res) => {
    try {
      const invoices = await GaapInvoice.find()
      res.status(200).json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'An error occurred while fetching invoices' });
    }
  },
};

module.exports = gaapInvoiceController;
