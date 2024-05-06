const mongoose = require('mongoose');
const Invoice = require('../../Model/Invoices');
const Expense = require('../../Model/Expense');
const Project = require('../../Model/Project');
const Customer = require('../../Model/Customer');

const getDashboardData = async (req, res) => {
    const adminId = req.adminId;
    const period = req.body.period; 

    if (!adminId) {
        return res.status(400).json({ message: "AdminId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        return res.status(400).json({ message: "Invalid AdminId" });
    }

    if (!period || !['month', 'year'].includes(period)) {
        return res.status(400).json({ message: "Invalid period" });
    }

    const objectIdAdminId = new mongoose.Types.ObjectId(adminId);
    const currentDate = new Date();
    const previousPeriodStart = period === 'month' ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1) : new Date(currentDate.getFullYear() - 1, 0, 1);
    const previousPeriodEnd = period === 'month' ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 0) : new Date(currentDate.getFullYear(), 0, 0);

    try {
        const [allExpenses, totalRevenue, totalEarnings, paidInvoicesCount, unpaidInvoicesCount, allInvoices, numberOfProjects, totalCustomers, currentPeriodCustomers, previousPeriodData, monthlyProfitData, monthlyRevenueData, monthlyExpensesData] = await Promise.all([
            Expense.aggregate([
                { $match: { AdminID: objectIdAdminId } },
                { $group: { _id: null, totalExpenses: { $sum: "$Amount" } } }
            ]),
            Invoice.aggregate([
                { $match: { AdminID: objectIdAdminId, Status: 'paid' } },
                { $group: { _id: null, total: { $sum: "$SubTotal" } } }
            ]),
            Invoice.aggregate([
                { $match: { AdminID: objectIdAdminId, Status: 'paid' } },
                { $group: { _id: null, total: { $sum: "$InvoiceTotal" } } }
            ]),
            Invoice.countDocuments({ AdminID: objectIdAdminId, Status: 'paid' }),
            Invoice.countDocuments({ AdminID: objectIdAdminId, Status: 'due' }),
            Invoice.find({ AdminID: objectIdAdminId }),
            Project.countDocuments({ AdminID: objectIdAdminId }),
            Customer.countDocuments({ AdminID: objectIdAdminId }),
            Customer.countDocuments({ AdminID: objectIdAdminId, DateJoined: { $gte: previousPeriodEnd } }),
            getPreviousPeriodData(objectIdAdminId, previousPeriodStart, previousPeriodEnd),
            getMonthlyData(objectIdAdminId, 'profit'),
            getMonthlyData(objectIdAdminId, 'revenue'),
            getMonthlyData(objectIdAdminId, 'expenses')
        ]);

        const profit = totalRevenue[0] ? totalRevenue[0].total - (allExpenses[0] ? allExpenses[0].totalExpenses : 0) : 0;
        const currentPeriodData = {
            Expenses: allExpenses[0] ? allExpenses[0].totalExpenses : 0,
            Profit: profit,
            Orders: numberOfProjects,
            Customers: currentPeriodCustomers,
            Sales: paidInvoicesCount,
            Revenue: totalRevenue[0] ? totalRevenue[0].total : 0,
            Earnings: totalEarnings[0] ? totalEarnings[0].total : 0
        };

        const ratios = calculateRatios(currentPeriodData, previousPeriodData);

        res.json({
            ...currentPeriodData,
            TotalCustomers: totalCustomers,
            PaidInvoices: paidInvoicesCount,
            UnpaidInvoices: unpaidInvoicesCount,
            AllInvoices: allInvoices,
            Ratios: ratios,
            MonthlyProfit: monthlyProfitData,
            MonthlyRevenue: monthlyRevenueData,
            MonthlyExpenses: monthlyExpensesData
        });
    } catch (error) {
        console.error("Error retrieving business metrics:", error);
        res.status(500).json({ message: "Error retrieving business metrics", error: error.message });
    }
};

const getPreviousPeriodData = async (objectIdAdminId, previousPeriodStart, previousPeriodEnd) => {
    const [previousPeriodExpenses, previousPeriodRevenue, previousPeriodEarnings, previousPeriodProjects, previousPeriodCustomers] = await Promise.all([
        Expense.aggregate([
            { $match: { AdminID: objectIdAdminId, Date: { $gte: new Date(previousPeriodStart), $lte: new Date(previousPeriodEnd) } } },
            { $group: { _id: null, totalExpenses: { $sum: "$Amount" } } }
        ]),
        Invoice.aggregate([
            { $match: { AdminID: objectIdAdminId, Status: 'paid', InvoiceDate: { $gte: new Date(previousPeriodStart), $lte: new Date(previousPeriodEnd) } } },
            { $group: { _id: null, total: { $sum: "$SubTotal" } } }
        ]),
        Invoice.aggregate([
            { $match: { AdminID: objectIdAdminId, Status: 'paid', InvoiceDate: { $gte: new Date(previousPeriodStart), $lte: new Date(previousPeriodEnd) } } },
            { $group: { _id: null, total: { $sum: "$InvoiceTotal" } } }
        ]),
        Project.countDocuments({ AdminID: objectIdAdminId, StartDate: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }),
        Customer.countDocuments({ AdminID: objectIdAdminId, DateJoined: { $gte: previousPeriodStart, $lte: previousPeriodEnd } })
    ]);

    const previousPeriodProfit = previousPeriodRevenue[0] ? previousPeriodRevenue[0].total - (previousPeriodExpenses[0] ? previousPeriodExpenses[0].totalExpenses : 0) : 0;
    const previousPeriodPaidInvoices = await Invoice.countDocuments({ AdminID: objectIdAdminId, Status: 'paid', InvoiceDate: { $gte: new Date(previousPeriodStart), $lte: new Date(previousPeriodEnd) } });

    return {
        Expenses: previousPeriodExpenses[0] ? previousPeriodExpenses[0].totalExpenses : 0,
        Profit: previousPeriodProfit,
        Orders: previousPeriodProjects,
        Customers: previousPeriodCustomers,
        Sales: previousPeriodPaidInvoices,
        Revenue: previousPeriodRevenue[0] ? previousPeriodRevenue[0].total : 0,
        Earnings: previousPeriodEarnings[0] ? previousPeriodEarnings[0].total : 0
    };
};

const calculateRatios = (currentPeriodData, previousPeriodData) => {
    const ratios = {};

    for (const key in currentPeriodData) {
        if (previousPeriodData[key] !== 0) {
            const ratio = ((currentPeriodData[key] - previousPeriodData[key]) / previousPeriodData[key]) * 100;
            ratios[`${key}Ratio`] = ratio >= 0 ? ratio.toFixed(2) : `-${Math.abs(ratio).toFixed(2)}`; 
        } else if (currentPeriodData[key] !== 0) {
            ratios[`${key}Ratio`] = "Infinity"; 
        } else {
            ratios[`${key}Ratio`] = "0.00";
        }
    }

    return ratios;
};

const getMonthlyData = async (objectIdAdminId, dataType) => {
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0);

    const aggregationPipeline = [
        { $match: { AdminID: objectIdAdminId } },
        {
            $project: {
                month: { $month: { $toDate: "$InvoiceDate" } },
                year: { $year: { $toDate: "$InvoiceDate" } },
                amount: {
                    $cond: [
                        { $eq: [dataType, 'profit'] },
                        { $subtract: ["$InvoiceTotal", "$Expenses"] },
                        {
                            $cond: [
                                { $eq: [dataType, 'revenue'] },
                                "$InvoiceTotal",
                                "$Expenses"
                            ]
                        }
                    ]
                }
            }
        },
        {
            $match: {
                year: currentYear
            }
        },
        {
            $group: {
                _id: "$month",
                total: { $sum: "$amount" }
            }
        },
        {
            $project: {
                _id: 0,
                month: "$_id",
                total: 1
            }
        }
    ];

    const result = await Invoice.aggregate(aggregationPipeline);

    result.forEach(item => {
        monthlyData[item.month - 1] = item.total;
    });

    return monthlyData;
};

module.exports = { getDashboardData };
