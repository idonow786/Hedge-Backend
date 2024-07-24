const { DailyFinancialRecord } = require('../../Model/ProjectExoense');
const FamilyExpense = require('../../Model/FamilyAccount');

const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.body;
    const adminId = req.adminId;

    let query = { 'projectExpenses.adminId': adminId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = {
        $gte: new Date(startDate),
      };
    } else if (endDate) {
      query.date = {
        $lte: new Date(endDate),
      };
    }

    let dailyRecords = await DailyFinancialRecord.find(query);

    if (search) {
      const searchNumber = parseFloat(search);
      dailyRecords = dailyRecords.map(record => {
        const filteredProjectExpenses = record.projectExpenses.filter(expense => {
          if (!isNaN(searchNumber)) {
            return expense.description.toLowerCase().includes(search.toLowerCase()) ||
                   expense.totalAmount >= searchNumber;
          } else {
            return expense.description.toLowerCase().includes(search.toLowerCase());
          }
        });
        return { ...record.toObject(), projectExpenses: filteredProjectExpenses };
      }).filter(record => record.projectExpenses.length > 0);
    }

    const expenses = dailyRecords.flatMap(record => 
      record.projectExpenses.map(expense => ({
        ...expense,
        date: record.date
      }))
    );

    // Fetch family expenses separately
    const familyExpenses = await FamilyExpense.find({ userId: adminId });

    res.status(200).json({
      message: 'Expenses retrieved successfully',
      expenses: expenses,
      familyExpenses: familyExpenses,
    });
  } catch (error) {
    console.error('Error retrieving expenses:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { getExpenses };
