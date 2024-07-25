const ProjectExpense = require('../../Model/ProjectExoense');
const ProjectC = require('../../Model/projectConstruction');

const getProjectExpensesC = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await ProjectC.findOne({ _id: projectId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const expenses = await ProjectExpense.find({ projectId }).sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

    const response = {
      projectDetails: {
        name: project.projectName,
        description: project.projectDescription,
        startDate: project.startDate,
        estimatedCompletionDate: project.estimatedCompletionDate,
        location: project.projectLocation,
      },
      budget: {
        estimatedBudget: project.budget.estimatedBudget,
        fundingSource: project.budget.fundingSource,
        costBreakdown: project.budget.costBreakdown,
      },
      resources: project.resources,
      expenses: {
        total: totalExpenses,
        records: expenses.map(expense => ({
          id: expense._id,
          date: expense.date,
          category: expense.category,
          description: expense.description,
          amount: expense.totalAmount,
          paidBy: expense.paidBy,
          isReimbursed: expense.isReimbursed,
          subcategories: expense.subcategories,
        })),
      },
      financialSummary: {
        estimatedBudget: project.budget.estimatedBudget,
        totalExpenses: totalExpenses,
        remainingBudget: project.budget.estimatedBudget - totalExpenses,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching project expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={getProjectExpensesC}