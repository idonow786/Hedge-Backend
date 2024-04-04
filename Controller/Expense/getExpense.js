const Expense = require('../../Model/Expense');

const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.user.adminId;

    let query = { AdminID: adminId };

    if (startDate && endDate) {
      query.Date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.Date = {
        $gte: new Date(startDate),
        $lte: new Date(startDate),
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

    res.status(200).json({
      message: 'Expenses retrieved successfully',
      expenses,
    });
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getExpenses };
