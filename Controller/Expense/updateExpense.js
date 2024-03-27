const Expense = require('../../Model/Expense');

const updateExpense = async (req, res) => {
  try {
    const { ExpenseId, ExpenseTitle, Amount, Date, Description } = req.body;

    if (!ExpenseId) {
      return res.status(400).json({ message: 'ExpenseId is required' });
    }

    const expense = await Expense.findById( ExpenseId );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.ExpenseTitle = ExpenseTitle || expense.ExpenseTitle;
    expense.Amount = Amount || expense.Amount;
    expense.Date = Date || expense.Date;
    expense.Description = Description || expense.Description;

    const updatedExpense = await expense.save();

    res.status(200).json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={updateExpense}