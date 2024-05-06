const mongoose = require('mongoose');
const Invoice = require('../../Model/Invoices');
const Expense = require('../../Model/Expense');
const Project = require('../../Model/Project');
const Customer = require('../../Model/Customer');

const getDashboardData = async (req, res) => {
    const adminId = req.adminId;
    console.log("Admin ID:", adminId); 

    try {
        const objectIdAdminId = new mongoose.Types.ObjectId(adminId); 

        const allExpenses = await Expense.aggregate([
            { $match: { AdminID: objectIdAdminId } },
            { $group: { _id: null, totalExpenses: { $sum: "$Amount" } } }
        ]);
        console.log("All Expenses:", allExpenses); 

        const totalRevenue = await Invoice.aggregate([
            { $match: { AdminID: objectIdAdminId, Status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$SubTotal" } } }
        ]);
        console.log("Total Revenue:", totalRevenue); 

        const totalEarnings = await Invoice.aggregate([
            { $match: { AdminID: objectIdAdminId, Status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$InvoiceTotal" } } }
        ]);
        console.log("Total Earnings:", totalEarnings);

        const paidInvoicesCount = await Invoice.countDocuments({ AdminID: objectIdAdminId, Status: 'paid' });
        const unpaidInvoicesCount = await Invoice.countDocuments({ AdminID: objectIdAdminId, Status: 'due' });
        const allInvoices = await Invoice.find({ AdminID: objectIdAdminId });

        const numberOfProjects = await Project.countDocuments({ AdminID: objectIdAdminId });
        const numberOfCustomers = await Customer.countDocuments({ AdminID: objectIdAdminId });

        const profit = totalRevenue[0] ? totalRevenue[0].total - (allExpenses[0] ? allExpenses[0].totalExpenses : 0) : 0;

        res.json({
            Expenses: allExpenses[0] ? allExpenses[0].totalExpenses : 0,
            Profit: profit,
            Orders: numberOfProjects,
            Customers: numberOfCustomers,
            Sales: paidInvoicesCount,
            Revenue: totalRevenue[0] ? totalRevenue[0].total : 0,
            Earnings: totalEarnings[0] ? totalEarnings[0].total : 0,
            PaidInvoices: paidInvoicesCount,
            UnpaidInvoices: unpaidInvoicesCount,
            AllInvoices: allInvoices
        });
    } catch (error) {
        console.error("Error retrieving business metrics:", error);
        res.status(500).send({ message: "Error retrieving business metrics", error: error.message });
    }
};

module.exports = { getDashboardData };
