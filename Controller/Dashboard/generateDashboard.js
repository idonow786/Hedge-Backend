const Wallet = require('../../Model/Wallet');
const Invoice = require('../../Model/Invoices');
const Staff = require('../../Model/Staff');

const getDashboardData = async (req, res) => {
  try {
    const { month } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!month) {
      return res.status(400).json({ message: 'Month is required' });
    }

    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const monthNumber = monthMap[month.toLowerCase()];

    if (monthNumber === undefined) {
      return res.status(400).json({ message: 'Invalid month' });
    }

    const currentYear = new Date().getFullYear();

    const wallet = await Wallet.findOne({
      AdminID: adminId,
      // period: {
      //   $gte: new Date(currentYear, monthNumber, 1),
      //   $lt: new Date(currentYear, monthNumber + 1, 1),
      // },
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found for the specified month' });
    }

    const profitArray = new Array(12).fill(0);
    const expenseArray = new Array(12).fill(0);
    const revenueArray = new Array(12).fill(0);

    for (let monthNumber = 0; monthNumber < 12; monthNumber++) {
      const wallet = await Wallet.findOne({
        AdminID: adminId,
        period: {
          $gte: new Date(currentYear, monthNumber, 1),
          $lt: new Date(currentYear, monthNumber + 1, 1),
        },
      });

      if (wallet) {
        profitArray[monthNumber] = parseFloat(wallet.Profit);
        expenseArray[monthNumber] = parseFloat(wallet.TotalExpenses);
        revenueArray[monthNumber] = parseFloat(wallet.TotalRevenue);
      }
    }

    const invoices = await Invoice.find({ AdminID: adminId });
    const staff = await Staff.find({ AdminID: adminId });
    res.status(200).json({
      wallet, profitArray,
      expenseArray,
      revenueArray,
      invoices,
      staff,
    });
  } catch (error) {
    console.error('Error retrieving wallet by month:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports = { getDashboardData };
