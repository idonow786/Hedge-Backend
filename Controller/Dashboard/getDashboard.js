const Dashboard = require('../../Model/Dashboard');

const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const dashboardData = await Dashboard.findOne({ Date: today });

    if (!dashboardData) {
      return res.status(404).json({ message: 'Dashboard data not found' });
    }

    res.status(200).json({
      message: 'Dashboard data retrieved successfully',
      dashboardData,
    });
  } catch (error) {
    console.error('Error retrieving dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={getDashboardData}