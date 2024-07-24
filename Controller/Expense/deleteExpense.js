const Expense = require('../../Model/Expense');
const Wallet = require('../../Model/Wallet');
const { DailyFinancialRecord } = require('../../Model/ProjectExoense');
const FamilyExpense = require('../../Model/FamilyAccount');
const deleteExpense = async (req, res) => {
  try {
    const { ExpenseId } = req.body;
    const adminId = req.adminId;

    if (!ExpenseId) {
      return res.status(400).json({ message: 'ExpenseId is required' });
    }

    const expense = await Expense.findOne({ _id: ExpenseId, AdminID: adminId });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not authorized' });
    }

    const deletedExpense = await Expense.findByIdAndDelete(ExpenseId);

    const expenseDate = deletedExpense.Date;
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();

    const wallet = await Wallet.findOne({
      AdminID: adminId,
      period: {
        $gte: new Date(expenseYear, expenseMonth, 1),
        $lt: new Date(expenseYear, expenseMonth + 1, 1),
      },
    });

    if (wallet) {
      wallet.TotalExpenses = (parseFloat(wallet.TotalExpenses) - parseFloat(deletedExpense.Amount)).toString();
      await wallet.save();
    }

    res.status(200).json({
      message: 'Expense deleted successfully',
      expense: deletedExpense,
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { deleteExpense };
