const Expense = require('../../Model/Expense');
const Wallet = require('../../Model/Wallet');

const addExpense = async (req, res) => {
  try {
    const { ExpenseTitle, Amount, expenseDate, Description, expenseType } = req.body;
    const adminId = req.adminId;

    if (!ExpenseTitle || !Amount || !expenseDate || !expenseType) {
      return res.status(400).json({ message: 'ExpenseTitle, Amount, expenseType, and expenseDate are required' });
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

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
    });

    if (wallet) {
      wallet.TotalExpenses = (parseFloat(wallet.TotalExpenses) + parseFloat(Amount)).toString();
    } else {
      wallet = new Wallet({
        TotalExpenses: Amount,
        AdminID: adminId,
        period: new Date(currentYear, currentMonth, 1),
      });
    }

    await wallet.save();

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
