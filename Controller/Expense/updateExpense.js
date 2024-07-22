const Expense = require('../../Model/Expense');
const ProjectExpense = require('../../Model/ProjectExoense');
const FamilyExpense = require('../../Model/FamilyAccount');

const updateExpense = async (req, res) => {
  try {
    const { 
      ExpenseId, 
      ExpenseTitle, 
      Amount, 
      expenseDate, 
      Description, 
      expenseType,
      projectExpense,
      familyExpense
    } = req.body;
    const adminId = req.adminId;

    if (!ExpenseId) {
      return res.status(400).json({ message: 'ExpenseId is required' });
    }

    let updatedExpense, updatedProjectExpense, updatedFamilyExpense;

    const expense = await Expense.findOne({ _id: ExpenseId, AdminID: adminId });
    if (expense) {
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
      expense.ExpenseType = expenseType || expense.ExpenseType;

      updatedExpense = await expense.save();
    }

    if (projectExpense) {
      const projectExp = await ProjectExpense.findOne({ _id: ExpenseId, AdminID: adminId });
      if (projectExp) {
        Object.assign(projectExp, projectExpense);
        updatedProjectExpense = await projectExp.save();
      }
    }

    if (familyExpense) {
      const familyExp = await FamilyExpense.findOne({ expenseId: ExpenseId, userId: adminId });
      if (familyExp) {
        if (familyExpense.expenses) {
          familyExp.expenses = familyExpense.expenses;
        }
        if (familyExpense.notes) {
          familyExp.notes = familyExpense.notes;
        }
        if (familyExpense.month) {
          familyExp.month = familyExpense.month;
        }
        if (familyExpense.year) {
          familyExp.year = familyExpense.year;
        }
        updatedFamilyExpense = await familyExp.save();
      }
    }

    if (!updatedExpense && !updatedProjectExpense && !updatedFamilyExpense) {
      return res.status(404).json({ message: 'No expense found or not authorized' });
    }

    res.status(200).json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
      projectExpense: updatedProjectExpense,
      familyExpense: updatedFamilyExpense
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateExpense };
