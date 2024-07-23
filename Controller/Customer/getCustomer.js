const Customer = require('../../Model/Customer');
const CustomerWallet = require('../../Model/CustomerWallet');

const getCustomers = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.adminId
;

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

    const customers = await Customer.find(query);

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

    const customer = await Customer.findOne({ _id: customerId, AdminID: adminId });

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


module.exports = { getCustomers,getCustomerWalletData };
