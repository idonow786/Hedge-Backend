const Invoice = require('../../Model/Invoices');
const Customer = require('../../Model/Customer');
const Dashboard = require('../../Model/Dashboard');
const Wallet = require('../../Model/Wallet');

const generateDashboardData = async (req, res) => {
  try {
    const adminId = req.adminId
;
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sales = await Invoice.countDocuments({
      InvoiceDate: {
        $gte: lastWeek,
        $lte: today,
      },
      Status: 'paid',
      AdminID: adminId,
    });

    const revenue = await Invoice.aggregate([
      {
        $match: {
          InvoiceDate: {
            $gte: lastWeek,
            $lte: today,
          },
          Status: 'paid',
          AdminID: adminId,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$InvoiceTotal' },
        },
      },
    ]);

    const totalRevenue = revenue.length > 0 ? revenue[0].totalRevenue : 0;

    const leads = await Customer.countDocuments({
      DateJoined: {
        $gte: lastWeek,
        $lte: today,
      },
      AdminID: adminId,
    });

    const newCustomers = await Invoice.distinct('CustomerId', {
      InvoiceDate: {
        $gte: lastWeek,
        $lte: today,
      },
      Status: 'paid',
      AdminID: adminId,
    }).length;

    const conversion = leads > 0 ? (newCustomers / leads) * 100 : 0;

    const totalInvoices = await Invoice.countDocuments({
      InvoiceDate: {
        $gte: lastWeek,
        $lte: today,
      },
      AdminID: adminId,
    });

    const revenueReportData = await Invoice.aggregate([
      {
        $match: {
          InvoiceDate: {
            $gte: new Date(today.getFullYear(), 0, 1),
            $lte: today,
          },
          Status: 'paid',
          AdminID: adminId,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$InvoiceDate' } },
          netProfit: { $sum: { $subtract: ['$InvoiceTotal', '$Vat'] } },
          revenue: { $sum: '$InvoiceTotal' },
          totalCost: { $sum: '$SubTotal' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          Month: '$_id',
          NetProfit: '$netProfit',
          Revenue: '$revenue',
          FreeCashFlow: { $subtract: ['$revenue', '$totalCost'] },
        },
      },
    ]);

    const wallet = await Wallet.findOne({ AdminID: adminId });
    const totalOrders = await Invoice.countDocuments({
      InvoiceDate: {
        $gte: lastWeek,
        $lte: today,
      },
      AdminID: adminId,
    });
    const totalExpenses = wallet ? wallet.TotalExpenses : 0;
    const profit = totalRevenue - totalExpenses;
    const earnings = totalRevenue;
    const successRate = 80; 
    const returnRate = 20; 

    const statisticsData = {
      Orders: totalOrders,
      Profit: profit,
      Earnings: earnings,
      SuccessRate: successRate,
      ReturnRate: returnRate,
    };

    let dashboardData = await Dashboard.findOne({ AdminID: adminId });

    if (!dashboardData) {
      dashboardData = new Dashboard({
        Date: today,
        Sales: sales,
        Revenue: totalRevenue,
        Conversion: conversion,
        Leads: leads,
        NewCustomers: newCustomers,
        TotalInvoices: totalInvoices,
        RevenueReport: revenueReportData,
        Statistics: statisticsData,
        AdminID: adminId,
      });
    } else {
      dashboardData.Date = today;
      dashboardData.Sales = sales;
      dashboardData.Revenue = totalRevenue;
      dashboardData.Conversion = conversion;
      dashboardData.Leads = leads;
      dashboardData.NewCustomers = newCustomers;
      dashboardData.TotalInvoices = totalInvoices;
      dashboardData.RevenueReport = revenueReportData;
      dashboardData.Statistics = statisticsData;
    }

    await dashboardData.save();

    res.status(200).json({
      message: 'Dashboard data generated successfully',
      dashboardData,
    });
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { generateDashboardData };
