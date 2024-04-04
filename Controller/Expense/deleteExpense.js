const Expense = require('../../Model/Expense');

const deleteExpense = async (req, res) => {
  try {
    const { ExpenseId } = req.body;
    const adminId = req.user.adminId;

    if (!ExpenseId) {
      return res.status(400).json({ message: 'ExpenseId is required' });
    }

    const expense = await Expense.findOne({ _id: ExpenseId, AdminID: adminId });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not authorized' });
    }

    const deletedExpense = await Expense.findByIdAndDelete(ExpenseId);

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
