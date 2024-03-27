const Expense = require('../../Model/Expense');

const addExpense = async (req, res) => {
  try {
    const { ExpenseTitle, Amount, Date, Description } = req.body;

    if (!ExpenseTitle || !Amount || !Date) {
      return res.status(400).json({ message: 'ExpenseTitle, Amount, and Date are required' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    const newExpense = new Expense({
      ID,
      ExpenseTitle,
      Amount,
      Date,
      Description,
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

module.exports={addExpense}