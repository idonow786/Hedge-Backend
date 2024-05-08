const Wallet = require('../../Model/Wallet');
const Invoice = require('../../Model/Invoices');
const Staff = require('../../Model/Staff');

const getDashboardData = async (req, res) => {
  try {
    const { month, year } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!month && !year) {
      return res.status(400).json({ message: 'Month or year is required' });
    }

    const currentYear = new Date().getFullYear();
    let wallets = [];
    let previousWallets = [];

    if (month) {
      const monthMap = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };

      const monthNumber = monthMap[month.toLowerCase()];

      if (monthNumber === undefined) {
        return res.status(400).json({ message: 'Invalid month' });
      }

      wallets = await Wallet.find({
        AdminID: adminId,
        period: {
          $gte: new Date(currentYear, monthNumber, 1),
          $lt: new Date(currentYear, monthNumber + 1, 1),
        },
      });

      const previousMonthNumber = monthNumber === 0 ? 11 : monthNumber - 1;
      previousWallets = await Wallet.find({
        AdminID: adminId,
        period: {
          $gte: new Date(currentYear, previousMonthNumber, 1),
          $lt: new Date(currentYear, previousMonthNumber + 1, 1),
        },
      });
    } else if (year) {
      wallets = await Wallet.find({
        AdminID: adminId,
        period: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      });

      previousWallets = await Wallet.find({
        AdminID: adminId,
        period: {
          $gte: new Date(year - 1, 0, 1),
          $lt: new Date(year, 0, 1),
        },
      });
    }

    const aggregatedWallet = wallets.length > 0 ? aggregateWallets(wallets) : createEmptyWallet();
    const previousAggregatedWallet = previousWallets.length > 0 ? aggregateWallets(previousWallets) : createEmptyWallet();

    const ratios = {
      TotalSales: calculateRatio(aggregatedWallet.TotalSales, previousAggregatedWallet.TotalSales),
      TotalRevenue: calculateRatio(aggregatedWallet.TotalRevenue, previousAggregatedWallet.TotalRevenue),
      TotalInvoices: calculateRatio(aggregatedWallet.TotalInvoices, previousAggregatedWallet.TotalInvoices),
      TotalExpenses: calculateRatio(aggregatedWallet.TotalExpenses, previousAggregatedWallet.TotalExpenses),
      TotalEarnings: calculateRatio(aggregatedWallet.TotalEarnings, previousAggregatedWallet.TotalEarnings),
      TotalOrders: calculateRatio(aggregatedWallet.TotalOrders, previousAggregatedWallet.TotalOrders),
      TotalCustomers: calculateRatio(aggregatedWallet.TotalCustomers, previousAggregatedWallet.TotalCustomers),
      PaidInvoices: calculateRatio(aggregatedWallet.PaidInvoices, previousAggregatedWallet.PaidInvoices),
      UnPaidInvoices: calculateRatio(aggregatedWallet.UnPaidInvoices, previousAggregatedWallet.UnPaidInvoices),
      Profit: calculateRatio(aggregatedWallet.Profit, previousAggregatedWallet.Profit),
    };
    const profitArray = new Array(12).fill(0);
    const expenseArray = new Array(12).fill(0);
    const revenueArray = new Array(12).fill(0);

    for (let monthNumber = 0; monthNumber < 12; monthNumber++) {
      const walletData = await Wallet.findOne({
        AdminID: adminId,
        period: {
          $gte: new Date(currentYear, monthNumber, 1),
          $lt: new Date(currentYear, monthNumber + 1, 1),
        },
      });

      if (walletData) {
        profitArray[monthNumber] = parseFloat(walletData.Profit);
        expenseArray[monthNumber] = parseFloat(walletData.TotalExpenses);
        revenueArray[monthNumber] = parseFloat(walletData.TotalRevenue);
      }
    }


    const invoices = await Invoice.find({ AdminID: adminId });
    const staff = await Staff.find({ AdminID: adminId });

    res.status(200).json({
      wallet: aggregatedWallet,
      ratios,
      profitArray,
      expenseArray,
      revenueArray,
      invoices,
      staff,
    });
  } catch (error) {
    console.error('Error retrieving dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function aggregateWallets(wallets) {
  const aggregatedWallet = {
    TotalSales: 0,
    TotalRevenue: 0,
    TotalInvoices: 0,
    TotalExpenses: 0,
    TotalEarnings: 0,
    TotalOrders: 0,
    TotalCustomers: 0,
    PaidInvoices: 0,
    UnPaidInvoices: 0,
    Profit: 0,
  };

  wallets.forEach((wallet) => {
    aggregatedWallet.TotalSales += parseFloat(wallet.TotalSales);
    aggregatedWallet.TotalRevenue += parseFloat(wallet.TotalRevenue);
    aggregatedWallet.TotalInvoices += parseFloat(wallet.TotalInvoices);
    aggregatedWallet.TotalExpenses += parseFloat(wallet.TotalExpenses);
    aggregatedWallet.TotalEarnings += parseFloat(wallet.TotalEarnings);
    aggregatedWallet.TotalOrders += parseFloat(wallet.TotalOrders);
    aggregatedWallet.TotalCustomers += parseFloat(wallet.TotalCustomers);
    aggregatedWallet.PaidInvoices += parseFloat(wallet.PaidInvoices);
    aggregatedWallet.UnPaidInvoices += parseFloat(wallet.UnPaidInvoices);
    aggregatedWallet.Profit += parseFloat(wallet.Profit);
  });

  return aggregatedWallet;
}

function createEmptyWallet() {
  return {
    TotalSales: 0,
    TotalRevenue: 0,
    TotalInvoices: 0,
    TotalExpenses: 0,
    TotalEarnings: 0,
    TotalOrders: 0,
    TotalCustomers: 0,
    PaidInvoices: 0,
    UnPaidInvoices: 0,
    Profit: 0,
  };
}

function calculateRatio(currentValue, previousValue) {
  if (previousValue === 0) {
    return '0';
  }

  const ratio = ((currentValue - previousValue) / previousValue) * 100;
  return `${ratio > 0 ? '+' : ''}${ratio.toFixed(2)}%`;
}

module.exports = { getDashboardData };




