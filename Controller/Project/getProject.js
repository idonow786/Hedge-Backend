const Project = require('../../Model/Project');
const ProjectC = require('../../Model/projectConstruction');
const ProjectExpense = require('../../Model/ProjectExoense');
const Expense = require('../../Model/Expense');

const getProjects = async (req, res) => {
  try {
    const { activityFilter } = req.body;
    const adminId = req.adminId
;

    let activityFilterStartDate;

    if (activityFilter === 'Last 28 Days') {
      activityFilterStartDate = new Date();
      activityFilterStartDate.setDate(activityFilterStartDate.getDate() - 28);
    } else if (activityFilter === 'Last Month') {
      activityFilterStartDate = new Date();
      activityFilterStartDate.setMonth(activityFilterStartDate.getMonth() - 1);
    } else if (activityFilter === 'Last Year') {
      activityFilterStartDate = new Date();
      activityFilterStartDate.setFullYear(activityFilterStartDate.getFullYear() - 1);
    }

    const query = { AdminID: adminId };

    if (activityFilterStartDate) {
      query['Activity.Date'] = { $gte: activityFilterStartDate };
    }

    const projects = await Project.find(query)
      .populate('Title')
      .sort({ 'Activity.Date': -1 });

    res.status(200).json({
      message: 'Projects retrieved successfully',
      projects,
    });
  } catch (error) {
    console.error('Error retrieving projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const getProjectsByCustomerId = async (req, res) => {
  try {
    const { CustomerId } = req.query;
    const adminId = req.adminId;

    if (!CustomerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const projects = await Project.find({ CustomerId, AdminID: adminId });
    const projectsC = await ProjectC.find({ clientId: CustomerId, adminId: adminId });

    const projectsWithCost = await Promise.all(projects.map(async (project) => {
      const expenses = await Expense.find({ ProjectId: project.ID });
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.Amount, 0);
      
      return {
        ...project.toObject(),
        totalCost: parseFloat(project.Budget) || 0,
        totalExpenses: totalExpenses
      };
    }));

    const projectsCWithCost = await Promise.all(projectsC.map(async (project) => {
      const expenses = await ProjectExpense.find({ projectId: project._id });
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
      
      const resourcesCost = project.resources.reduce((sum, resource) => sum + (resource.quantity * resource.unitCost), 0);
      
      const estimatedBudget = project.budget.estimatedBudget || 0;
      const costBreakdown = project.budget.costBreakdown || {};
      const budgetTotal = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);

      return {
        ...project.toObject(),
        totalCost: Math.max(estimatedBudget, budgetTotal, resourcesCost),
        totalExpenses: totalExpenses
      };
    }));

    const allProjects1 = [...projectsWithCost, ...projectsCWithCost];
    console.log(allProjects1)
    res.status(200).json({
      message: 'Projects retrieved successfully',
      allProjects: allProjects1,
    });
  } catch (error) {
    console.error('Error retrieving projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




module.exports = { getProjects,getProjectsByCustomerId };
