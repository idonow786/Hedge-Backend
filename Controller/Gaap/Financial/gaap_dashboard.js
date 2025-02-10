// Import required models
const GaapProject = require("../../../Model/Gaap/gaap_project");
const ProjectPayment = require("../../../Model/Gaap/gaap_projectPayment");
const GaapInvoice = require("../../../Model/Gaap/gaap_invoice");
const GaapDsr = require("../../../Model/Gaap/gaap_dsr");
const GaapSalesTarget = require("../../../Model/Gaap/gaap_salestarget");
const GaapUser = require("../../../Model/Gaap/gaap_user");
const GaapTeam = require("../../../Model/Gaap/gaap_team");

/**
 * Utility function to replace spaces with underscores in a string.
 * @param {string} str - The input string.
 * @returns {string} - The transformed string with underscores.
 */
const replaceSpacesWithUnderscores = (str) => {
  return str.replace(/\s+/g, "_");
};

const getDashboardData = async (req, res) => {
  try {
    // 1. Fetch the user based on adminId
    const userId = req.adminId;
    const user = await GaapUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let teamId;
    let branchId;

    if (req.role === 'admin' || req.role === 'Audit Manager') {
      const team = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': req.adminId },
          { 'GeneralUser': { $elemMatch: { userId: req.adminId } } }

        ]
      });

      if (!team) {
        return res.status(404).json({ message: "Team not found for this admin/manager" });
      }
      teamId = team._id;

      // Only set branchId for Audit Manager or if admin has specific branch
      const isParentUser = team.parentUser.userId === req.adminId;
      if (!isParentUser) {
        branchId = user.branchId;
      }
    } else {
      teamId = user.teamId;
      branchId = user.branchId;
    }

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Build base query for all aggregations
    const baseQuery = { teamId };
    if (branchId) {
      baseQuery.branchId = branchId;
    }

    // 2. Overview of all projects
    const projectOverviewRaw = await GaapProject.aggregate([
      {
        $match: {
          ...baseQuery,
          status: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Define progress weights based on status
    const statusProgress = {
      Proposed: 0,
      "In Progress": 50,
      Approved: 75,
      Completed: 100,
      // Add more statuses and their corresponding progress if needed
    };

    // Calculate average progress based on projectOverviewRaw
    let totalProgress = 0;
    let totalProjects = 0;

    // Transform projectOverview keys by replacing spaces with underscores
    const projectOverview = projectOverviewRaw.reduce((acc, item) => {
      // Replace spaces with underscores in the status
      const statusKey = replaceSpacesWithUnderscores(item._id);
      acc[statusKey] = item.count;

      // Calculate total progress
      const progress =
        statusProgress[item._id] !== undefined ? statusProgress[item._id] : 0;
      totalProgress += progress * item.count;
      totalProjects += item.count;

      return acc;
    }, {});

    const averageProgress =
      totalProjects > 0 ? totalProgress / totalProjects : 0;

    // 3. Overview of all invoices
    const invoiceOverviewRaw = await GaapInvoice.aggregate([
      { 
        $match: baseQuery
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
    ]);

    // Transform invoiceOverview keys by replacing spaces with underscores (if needed)
    const invoiceOverview = invoiceOverviewRaw.reduce((acc, item) => {
      // Replace spaces with underscores in the status
      const statusKey = replaceSpacesWithUnderscores(item._id);
      acc[statusKey] = {
        count: item.count,
        totalAmount: item.totalAmount,
      };
      return acc;
    }, {});

    // 4. DSR (Daily Sales Report) summary for team users
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch distinct user IDs belonging to the team with proper branch filtering
    const teamUserQuery = { teamId };
    if (branchId) {
      teamUserQuery.branchId = branchId;
    }
    const teamUserIds = await GaapUser.find(teamUserQuery).distinct("_id");

    const dsrSummaryRaw = await GaapDsr.aggregate([
      {
        $match: {
          ...baseQuery,
          date: today,
          userId: { $in: teamUserIds },
        },
      },
      {
        $group: {
          _id: null,
          totalOfficeVisits: { $sum: "$officeVisits" },
          totalCardsCollected: { $sum: "$cardsCollected" },
          totalMeetings: { $sum: "$meetings" },
          totalProposals: { $sum: "$proposals" },
        },
      },
    ]);

    const dsrSummary = dsrSummaryRaw.length > 0 ? dsrSummaryRaw[0] : null;

    // 5. Financial overview
    const financialOverviewRaw = await ProjectPayment.aggregate([
      {
        $match: {
          ...baseQuery,
          "paymentHistory.date": { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $unwind: "$paymentHistory",
      },
      {
        $group: {
          _id: null,
          totalCashInflow: { $sum: "$paymentHistory.amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ]);

    const financialOverview = {
      totalCashInflow:
        financialOverviewRaw.length > 0
          ? financialOverviewRaw[0].totalCashInflow
          : 0,
      totalPayments:
        financialOverviewRaw.length > 0
          ? financialOverviewRaw[0].totalPayments
          : 0,
      totalInvoicesCreated: await GaapInvoice.countDocuments({
        ...baseQuery,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
    };

    // 6. Sales targets summary
    const salesTargetsSummaryRaw = await GaapSalesTarget.aggregate([
      {
        $match: {
          ...baseQuery,
          "targetPeriod.endDate": { $gte: currentDate },
        },
      },
      {
        $group: {
          _id: "$targetType",
          totalOfficeVisitsTarget: { $sum: "$targetDetails.officeVisits" },
          totalClosingsTarget: { $sum: "$targetDetails.closings" },
          totalOfficeVisitsAchieved: { $sum: "$achievedValue.officeVisits" },
          totalClosingsAchieved: { $sum: "$achievedValue.closings" },
        },
      },
    ]);

    // Transform salesTargetsSummary keys by replacing spaces with underscores (if needed)
    const salesTargetsSummary = salesTargetsSummaryRaw.reduce((acc, item) => {
      // Replace spaces with underscores in the targetType
      const targetTypeKey = replaceSpacesWithUnderscores(item._id);
      acc[targetTypeKey] = {
        officeVisits: {
          target: item.totalOfficeVisitsTarget,
          achieved: item.totalOfficeVisitsAchieved,
          progressPercentage:
            item.totalOfficeVisitsTarget > 0
              ? (item.totalOfficeVisitsAchieved /
                  item.totalOfficeVisitsTarget) *
                100
              : 0,
        },
        closings: {
          target: item.totalClosingsTarget,
          achieved: item.totalClosingsAchieved,
          progressPercentage:
            item.totalClosingsTarget > 0
              ? (item.totalClosingsAchieved / item.totalClosingsTarget) * 100
              : 0,
        },
      };
      return acc;
    }, {});

    // Prepare the final dashboard data
    const dashboardData = {
      projectOverview, // Already transformed with underscores
      invoiceOverview, // Already transformed with underscores
      dsrSummary,
      projectProgress: {
        averageProgress: parseFloat(averageProgress.toFixed(2)), // Rounded to 2 decimal places
        totalProjects: totalProjects,
      },
      financialOverview,
      salesTargetsSummary, // Already transformed with underscores
    };

    // Respond with the dashboard data
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: error.message });
  }
};

module.exports = {
  getDashboardData,
};
