const ProjectExpense = require('../../Model/ProjectExoense');

const getProjectExpenses = async (req, res) => {
  try {
    const { projectId } = req.body; 

    const expenses = await ProjectExpense.find({ projectId }).sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = [];
      }
      acc[expense.category].push(expense);
      return acc;
    }, {});

    const categoryTotals = Object.keys(expensesByCategory).reduce((acc, category) => {
      acc[category] = expensesByCategory[category].reduce((sum, expense) => sum + expense.totalAmount, 0);
      return acc;
    }, {});

    const response = {
      projectId,
      totalExpenses,
      categoryTotals,
      expensesByCategory: Object.keys(expensesByCategory).map(category => ({
        category,
        total: categoryTotals[category],
        expenses: expensesByCategory[category].map(expense => ({
          id: expense._id,
          description: expense.description,
          totalAmount: expense.totalAmount,
          date: expense.date,
          paidBy: expense.paidBy,
          isReimbursed: expense.isReimbursed,
          subcategories: expense.subcategories,
          receipt: expense.receipt,
          notes: expense.notes
        }))
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching project expenses:', error);
    res.status(500).json({ message: 'An error occurred while fetching project expenses' });
  }
};

module.exports={getProjectExpenses}