const Expense = require('../../Model/Expense');
const ProjectExpense = require('../../Model/ProjectExoense');
const FamilyExpense = require('../../Model/FamilyAccount');
const Wallet = require('../../Model/Wallet');

const addExpense = async (req, res) => {
  try {
    const { ExpenseTitle, Amount, expenseDate, Description, expenseType, projectExpense, familyExpense } = req.body;
    const adminId = req.adminId;

    let totalExpenseAmount = 0;
    let savedExpense, savedProjectExpense, savedFamilyExpense;

    if (ExpenseTitle && Amount && expenseDate && expenseType) {
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

      savedExpense = await newExpense.save();
      totalExpenseAmount += parseFloat(Amount);
    }

    if (projectExpense) {
      const { projectId, description, category, subcategories, paidBy, receipt, notes, isReimbursed } = projectExpense;

      if (!projectId || !category || !subcategories || !paidBy) {
        return res.status(400).json({ message: 'ProjectId, category, subcategories, and paidBy are required for project expense' });
      }

      const newProjectExpense = new ProjectExpense({
        projectId,
        description,
        category,
        subcategories,
        paidBy,
        receipt,
        notes,
        isReimbursed,
        AdminID: adminId,
      });

      savedProjectExpense = await newProjectExpense.save();
      totalExpenseAmount += savedProjectExpense.totalAmount;
    }

    if (familyExpense) {
      const { month, year, expenses, notes } = familyExpense;

      if (!month || !year || !expenses) {
        return res.status(400).json({ message: 'Month, year, and expenses are required for family expense' });
      }

      const expenseId = Math.floor(Math.random() * 1000000).toString();

      let existingFamilyExpense = await FamilyExpense.findOne({ userId: adminId, month, year });

      if (existingFamilyExpense) {
        existingFamilyExpense.expenses.push(...expenses);
        existingFamilyExpense.notes = notes;
        existingFamilyExpense.expenseId = expenseId;
        savedFamilyExpense = await existingFamilyExpense.save();
      } else {
        const newFamilyExpense = new FamilyExpense({
          userId: adminId,
          expenseId,
          month,
          year,
          expenses,
          notes,
        });
        savedFamilyExpense = await newFamilyExpense.save();
      }

      totalExpenseAmount += expenses.reduce((total, expense) => total + expense.amount, 0);
    }

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
      wallet.TotalExpenses = (parseFloat(wallet.TotalExpenses) + totalExpenseAmount).toString();
      wallet.Profit = (parseFloat(wallet.TotalRevenue) - parseFloat(wallet.TotalExpenses)).toString();
    } else {
      wallet = new Wallet({
        TotalExpenses: totalExpenseAmount.toString(),
        AdminID: adminId,
        period: new Date(currentYear, currentMonth, 1),
      });
    }

    await wallet.save();

    res.status(201).json({
      message: 'Expenses added successfully',
      expense: savedExpense,
      projectExpense: savedProjectExpense,
      familyExpense: savedFamilyExpense,
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addExpense };
