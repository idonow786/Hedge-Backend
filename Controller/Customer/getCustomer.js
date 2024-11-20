const Customer = require('../../Model/Customer');
const CustomerWallet = require('../../Model/CustomerWallet');
const ProjectC = require('../../Model/projectConstruction');
const Project = require('../../Model/Project');
const AMCCustomer = require('../../Model/AMCCustomer');
const getCustomers = async (req, res) => {
  try {
    const { startDate, endDate, search, customPropertySearch } = req.body;
    const adminId = req.adminId;

    let query = { AdminID: adminId };

    if (startDate && endDate) {
      query.DateJoined = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.DateJoined = {
        $gte: new Date(startDate),
        $lte: new Date(startDate),
      };
    } else if (endDate) {
      query.DateJoined = {
        $lte: new Date(endDate),
      };
    }

    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { Email: { $regex: search, $options: 'i' } },
        { PhoneNo: { $regex: search, $options: 'i' } },
      ];
    }

    if (customPropertySearch) {
      const { propertyName, propertyValue } = customPropertySearch;
      if (propertyName && propertyValue) {
        query['customProperties'] = {
          $elemMatch: {
            propertyName,
            propertyValue: { $regex: propertyValue, $options: 'i' }
          }
        };
      }
    }

    const [regularCustomers, amcCustomers] = await Promise.all([
      Customer.find(query),
      AMCCustomer.find(query)
    ]);

    const customers = [...regularCustomers, ...amcCustomers];

    customers.sort((a, b) => new Date(b.DateJoined) - new Date(a.DateJoined));

    res.status(200).json({
      message: 'Customers retrieved successfully',
      customers,
    });
  } catch (error) {
    console.error('Error retrieving customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



const getCustomerWalletData = async (req, res) => {
  try {
    const { customerId } = req.body;
    const adminId = req.adminId;

    let customer = await Customer.findOne({ _id: customerId, AdminID: adminId });

    if (!customer) {
      customer = await AMCCustomer.findOne({ _id: customerId, AdminID: adminId });
    }
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let customerWallet = await CustomerWallet.findOne({ customerId, adminId })
      .populate('expensePerProject.projectId', 'name');

    const response = {
      customerId: customer._id,
      customerName: customer.Name,
      customerEmail: customer.Email,
      customerPhone: customer.PhoneNo,
      customerCompany: customer.CompanyName,
      customerDateJoined: customer.DateJoined,
      customerPicUrl: customer.PicUrl,
      totalExpense: 0,
      totalBalance: 0,
      expensePerProject: [],
      yearlyBalances: [],
      totalProjectsDone: 0,
      totalProjectsDoing: 0,
      monthlyPayments: []
    };

    if (customerWallet) {
      response.totalExpense = customerWallet.totalExpense;
      response.totalBalance = customerWallet.totalBalance;
      response.expensePerProject = customerWallet.expensePerProject.map(exp => ({
        projectId: exp.projectId._id,
        projectName: exp.projectId.name,
        amount: exp.amount
      }));
      response.yearlyBalances = customerWallet.yearlyBalances;
      response.totalProjectsDone = customerWallet.totalProjectsDone;
      response.totalProjectsDoing = customerWallet.totalProjectsDoing;
      response.monthlyPayments = calculateMonthlyPayments(customerWallet.yearlyBalances);
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching customer wallet data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function calculateMonthlyPayments(yearlyBalances) {
  const monthlyPayments = [];

  yearlyBalances.forEach(yearData => {
    yearData.monthlyBalances.forEach(monthData => {
      monthlyPayments.push({
        year: yearData.year,
        month: monthData.month,
        amount: monthData.balance
      });
    });
  });

  monthlyPayments.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return monthlyPayments;
}





const getCustomerProjects = async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        const projectsC = await ProjectC.find({ clientId: customerId })
            .select('projectName projectDescription startDate estimatedCompletionDate budget.estimatedBudget');

        const projects = await Project.find({ CustomerId: customerId })
            .select('Title Description StartDate Deadline Budget');

        const formattedProjects = [
            ...projectsC.map(project => ({
                type: 'Construction',
                title: project.projectName,
                description: project.projectDescription,
                startDate: project.startDate,
                endDate: project.estimatedCompletionDate,
                budget: project.budget?.estimatedBudget
            })),
            ...projects.map(project => ({
                type: 'General',
                title: project.Title,
                description: project.Description,
                startDate: project.StartDate,
                endDate: project.Deadline,
                budget: project.Budget
            }))
        ];

        formattedProjects.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        res.status(200).json({
            message: "Projects fetched successfully",
            count: formattedProjects.length,
            projects: formattedProjects
        });

    } catch (error) {
        console.error('Error in getCustomerProjects:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


module.exports = { getCustomers,getCustomerWalletData,getCustomerProjects };