const Project = require('../../Model/Project');

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

module.exports = { getProjects };
