const Expense = require('../../Model/Expense');

const updateExpense = async (req, res) => {
  try {
    const { ExpenseId, ExpenseTitle, Amount, expenseDate, Description } = req.body;
    const adminId = req.adminId;

    if (!ExpenseId) {
      return res.status(400).json({ message: 'ExpenseId is required' });
    }

    const expense = await Expense.findOne({ _id: ExpenseId, AdminID: adminId });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or not authorized' });
    }

    expense.ExpenseTitle = ExpenseTitle || expense.ExpenseTitle;
    expense.Amount = Amount || expense.Amount;

    if (expenseDate) {
      let formattedDate;
      if (typeof expenseDate === 'string') {
        formattedDate = new Date(expenseDate.trim());
      } else if (typeof expenseDate === 'number') {
        formattedDate = new Date(expenseDate);
      } else {
        formattedDate = expenseDate;
      }
      expense.Date = formattedDate;
    }

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

module.exports = { updateExpense };
