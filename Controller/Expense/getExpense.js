const Expense = require('../../Model/Expense');
const ProjectExpense = require('../../Model/ProjectExoense');
const FamilyExpense = require('../../Model/FamilyAccount');

const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.adminId;

    let query = { AdminID: adminId };

    if (startDate && endDate) {
      query.Date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.Date = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      query.Date = {
        $lte: new Date(endDate),
      };
    }

    if (search) {
      const searchNumber = parseFloat(search);

      if (!isNaN(searchNumber)) {
        query.$or = [
          { ExpenseTitle: { $regex: search, $options: 'i' } },
          { Amount: { $gte: searchNumber } },
        ];
      } else {
        query.ExpenseTitle = { $regex: search, $options: 'i' };
      }
    }

    const expenses = await Expense.find(query);
    console.log(await ProjectExpense.find())
    console.log(await FamilyExpense.find())

    const expensesWithDetails = await Promise.all(expenses.map(async (expense) => {
      const expenseObj = expense.toObject();
      // Fetch project expense details
      console.log(expense.ProjectId )
      console.log( expense._id)
      const projectExpense = await ProjectExpense.findOne({ projectId: expense.ProjectId });
      if (projectExpense) {
        expenseObj.projectExpense = projectExpense;
      }

      // Fetch family expense details
      const familyExpense = await FamilyExpense.findOne({  userId: adminId});
      if (familyExpense) {
        expenseObj.familyExpense = familyExpense;
      }

      return expenseObj;
    }));

    res.status(200).json({
      message: 'Expenses retrieved successfully',
      expenses: expensesWithDetails,
    });
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { getExpenses };
