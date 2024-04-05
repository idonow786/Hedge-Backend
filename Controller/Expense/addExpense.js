const Expense = require('../../Model/Expense');

const addExpense = async (req, res) => {
  try {
    const { ExpenseTitle, Amount, expenseDate, Description, expenseType } = req.body;
    const adminId = req.adminId;

    if (!ExpenseTitle || !Amount || !expenseDate || !expenseType) {
      return res.status(400).json({ message: 'ExpenseTitle, Amount,expenseType, and expenseDate are required' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    let formattedDate;
    if (typeof expenseDate === 'string') {
      formattedDate = new Date(expenseDate.trim());
    } else if (typeof expenseDate === 'number') {
      formattedDate = new Date(expenseDate);
    } else {
      formattedDate = expenseDate;
    }

    const newExpense = new Expense({
      ID,
      ExpenseTitle,
      Amount,
      Date: formattedDate,
      Description,
      ExpenseType: expenseType,
      AdminID: adminId,
    });

    const savedExpense = await newExpense.save();

    res.status(201).json({
      message: 'Expense added successfully',
      expense: savedExpense,
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addExpense };
