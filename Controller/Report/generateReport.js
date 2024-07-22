const Invoice = require('../../Model/Invoices');
const Expense = require('../../Model/Expense');
const Customer = require('../../Model/Customer');
const Wallet = require('../../Model/Wallet');

const generateReports = async (req, res) => {
  try {
    const { startDate, endDate, specificDate, filter } = req.body;
    const adminId = req.adminId
;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (specificDate) {
      dateFilter = {
        $eq: new Date(specificDate),
      };
    }

    let reportData = [];

    if (filter === 'Sales' || filter === 'Revenue') {
      const invoices = await Invoice.find({
        InvoiceDate: dateFilter,
        Status: 'paid',
        AdminID: adminId,
      }).populate('CustomerId', 'Name');

      reportData = invoices.map((invoice) => ({
        InvoiceNumber: invoice.InvoiceNumber,
        CustomerName: invoice.CustomerId.Name,
        InvoiceDate: invoice.InvoiceDate,
        InvoiceTotal: invoice.InvoiceTotal,
      }));
    } else if (filter === 'Invoices') {
      const invoices = await Invoice.find({
        InvoiceDate: dateFilter,
        AdminID: adminId,
      }).populate('CustomerId', 'Name');

      reportData = invoices.map((invoice) => ({
        InvoiceNumber: invoice.InvoiceNumber,
        CustomerName: invoice.CustomerId.Name,
        InvoiceDate: invoice.InvoiceDate,
        InvoiceTotal: invoice.InvoiceTotal,
        Status: invoice.Status,
      }));
    } else if (filter === 'Expense') {
      const expenses = await Expense.find({
        Date: dateFilter,
        AdminID: adminId,
      });

      reportData = expenses.map((expense) => ({
        ExpenseTitle: expense.ExpenseTitle,
        Amount: expense.Amount,
        Date: expense.Date,
        Description: expense.Description,
      }));
    }

    const totalSales = await Invoice.aggregate([
      {
        $match: {
          InvoiceDate: dateFilter,
          Status: 'paid',
          AdminID: adminId,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$InvoiceTotal' },
        },
      },
    ]);

    const totalSalesAmount = totalSales.length > 0 ? totalSales[0].totalAmount : 0;

    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          Date: dateFilter,
          AdminID: adminId,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$Amount' },
        },
      },
    ]);

    const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].totalAmount : 0;

    const totalRevenue = totalSalesAmount;
    const profit = totalRevenue - totalExpensesAmount;

    const totalInvoices = await Invoice.countDocuments({
      InvoiceDate: dateFilter,
      AdminID: adminId,
    });

    let wallet = await Wallet.findOne({ AdminID: adminId });

    if (!wallet) {
      wallet = new Wallet({ AdminID: adminId });
    }

    wallet.TotalSales = totalSalesAmount;
    wallet.TotalRevenue = totalRevenue;
    wallet.TotalInvoices = totalInvoices;
    wallet.TotalExpenses = totalExpensesAmount;
    wallet.Profit = profit;

    await wallet.save();

    res.status(200).json({
      message: 'Reports generated successfully',
      reports: {
        sales: totalSalesAmount,
        revenue: totalRevenue,
        invoices: totalInvoices,
        expenses: totalExpensesAmount,
        profit: profit,
      },
      reportData,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { generateReports };
