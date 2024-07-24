const { DailyFinancialRecord } = require('../../Model/ProjectExoense');
const FamilyExpense = require('../../Model/FamilyAccount');
const Wallet = require('../../Model/Wallet');

const addExpense = async (req, res) => {
  try {
    const { expenseDate, projectExpense, familyExpense } = req.body;
    const adminId = req.adminId;

    if (!expenseDate) {
      return res.status(400).json({ message: 'Expense date is required' });
    }

    let totalExpenseAmount = 0;
    let savedProjectExpense, savedFamilyExpense;
    const formattedDate = new Date(expenseDate);

    // Find or create the daily record
    let dailyRecord = await findOrCreateDailyRecord(formattedDate);

    if (projectExpense) {
      savedProjectExpense = await addProjectExpense(projectExpense, adminId, formattedDate, dailyRecord);
      totalExpenseAmount += savedProjectExpense.totalAmount;
    }

    if (familyExpense) {
      savedFamilyExpense = await addFamilyExpense(familyExpense, adminId, formattedDate);
      totalExpenseAmount += savedFamilyExpense.totalAmount;
      updateDailyRecordWithFamilyExpense(dailyRecord, savedFamilyExpense.totalAmount);
    }

    // Save the updated daily record
    await dailyRecord.save();

    // Update wallet
    await updateWallet(adminId, totalExpenseAmount);

    res.status(201).json({
      message: 'Expenses added successfully',
      projectExpense: savedProjectExpense,
      familyExpense: savedFamilyExpense,
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


const findOrCreateDailyRecord = async (date) => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  let dailyRecord = await DailyFinancialRecord.findOne({
    date: { $gte: startOfDay, $lt: endOfDay }
  });

  if (!dailyRecord) {
    dailyRecord = new DailyFinancialRecord({
      date: startOfDay,
      totalRevenue: 0,
      totalExpenses: 0,
      expenses: [],
      revenue: [],
      projectExpenses: []
    });
  }

  return dailyRecord;
};

const addProjectExpense = async (projectExpense, adminId, date, dailyRecord) => {
  const { projectId, description, category, subcategories, paidBy, receipt, notes, isReimbursed, paymentMethod, vendor, budgetCategory, taxDeductible } = projectExpense;

  if (!projectId || !category || !subcategories || !paidBy || !paymentMethod || !budgetCategory) {
    throw new Error('Missing required fields for project expense');
  }

  const totalAmount = subcategories.reduce((total, subcategory) => total + (parseFloat(subcategory.amount) || 0), 0);

  const newProjectExpense = {
    projectId,
    description,
    adminId,
    totalAmount,
    category,
    subcategories,
    paidBy,
    receipt,
    notes,
    isReimbursed,
    paymentMethod,
    vendor,
    budgetCategory,
    taxDeductible
  };

  dailyRecord.projectExpenses.push(newProjectExpense);
  dailyRecord.expenses.push({
    category: 'Project Expense',
    amount: totalAmount,
  });

  dailyRecord.totalExpenses += totalAmount;

  return newProjectExpense;
};

const addFamilyExpense = async (familyExpense, adminId, date) => {
  const { month, year, expenses, notes } = familyExpense;

  if (!expenses || !Array.isArray(expenses)) {
    throw new Error('Expenses (as an array) are required for family expense');
  }

  const formattedExpenses = expenses.map(expense => ({
    expenseType: expense.category,
    amount: parseFloat(expense.amount),
    description: expense.description || '',
    date: date
  }));

  let existingFamilyExpense = await FamilyExpense.findOne({ userId: adminId });

  if (existingFamilyExpense) {
    existingFamilyExpense.expenses.push(...formattedExpenses);
    existingFamilyExpense.notes = notes;
  } else {
    existingFamilyExpense = new FamilyExpense({
      userId: adminId,
      expenses: formattedExpenses,
      notes
    });
  }

  const savedFamilyExpense = await existingFamilyExpense.save();

  return {
    totalAmount: savedFamilyExpense.totalAmount,
    expenses: savedFamilyExpense.expenses
  };
};


const updateExistingFamilyExpense = async (existingFamilyExpense, date, expenses, notes, expenseId, totalAmount) => {
  const dateString = date.toISOString().split('T')[0];
  let existingDailyExpense = existingFamilyExpense.dailyExpenses.find(
    day => day.date.toISOString().split('T')[0] === dateString
  );

  if (existingDailyExpense) {
    expenses.forEach(newExpense => {
      existingDailyExpense.expenses.push({
        amount: newExpense.amount,
        category: newExpense.category,
        date: date
      });
    });
    existingDailyExpense.totalAmount += totalAmount;
  } else {
    existingFamilyExpense.dailyExpenses.push({
      date,
      totalAmount,
      expenses: expenses.map(e => ({ ...e, date }))
    });
  }

  existingFamilyExpense.notes = notes;
  existingFamilyExpense.expenseId = expenseId;
  existingFamilyExpense.totalAmount = existingFamilyExpense.dailyExpenses.reduce(
    (total, day) => total + day.totalAmount, 0
  );

  return await existingFamilyExpense.save();
};

const createNewFamilyExpense = async (adminId, expenseId, month, year, date, expenses, notes, totalAmount) => {
  const newFamilyExpense = new FamilyExpense({
    userId: adminId,
    expenseId,
    month,
    year,
    dailyExpenses: [{
      date,
      totalAmount,
      expenses: expenses.map(e => ({ ...e, date }))
    }],
    notes,
    totalAmount
  });
  return await newFamilyExpense.save();
};

const updateWallet = async (adminId, totalExpenseAmount) => {
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
    wallet.TotalExpenses = (parseFloat(wallet.TotalExpenses || 0) + totalExpenseAmount).toString();
    wallet.Profit = (parseFloat(wallet.TotalRevenue || 0) - parseFloat(wallet.TotalExpenses)).toString();
  } else {
    wallet = new Wallet({
      TotalExpenses: totalExpenseAmount.toString(),
      AdminID: adminId,
      period: new Date(currentYear, currentMonth, 1),
    });
  }

  await wallet.save();
};

const updateDailyRecordWithFamilyExpense = (dailyRecord, familyExpenseAmount) => {
  dailyRecord.expenses.push({
    category: 'Family Expense',
    amount: familyExpenseAmount
  });
  dailyRecord.totalExpenses += familyExpenseAmount;
};

module.exports = { addExpense };
