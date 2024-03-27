const Expense = require('../../Model/Expense');

const deleteExpense = async (req, res) => {
  try {
    const { ExpenseId } = req.body;

    if (!ExpenseId) {
      return res.status(400).json({ message: 'ExpenseId is required' });
    }

    const deletedExpense = await Expense.findById(ExpenseId );

    if (!deletedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
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

module.exports={deleteExpense}