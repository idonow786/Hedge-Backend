const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapDsr = require('../../../Model/Gaap/gaap_dsr');
const GaapSalesTarget = require('../../../Model/Gaap/gaap_salestarget');

const getDashboardData = async (req, res) => {
    try {
        const adminId = req.adminId;
        const currentDate = new Date();

        // 1. Get users created by this admin
        const users = await GaapUser.find({ createdBy: adminId });
        const userIds = users.map(user => user._id);

        // 2. Get projects for these users
        const projects = await GaapProject.find({ assignedTo: { $in: userIds } });

        // 3. Process project data
        const projectStats = {
            total: projects.length,
            ongoing: projects.filter(p => p.status === 'In Progress').length,
            completed: projects.filter(p => p.status === 'Completed').length
        };

        const ongoingProjects = projects.filter(p => p.status === 'In Progress').map(p => ({
            name: p.projectName,
            progress: p.Progress
        }));

        // 4. Get DSR data
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dsrData = await GaapDsr.find({
            user: { $in: userIds },
            date: { $gte: startOfMonth, $lte: currentDate }
        });

        // 5. Get targets
        const targets = await GaapSalesTarget.find({
            createdBy: adminId,
            // 'targetPeriod.endDate': { $gte: currentDate }
        });

        // 6. Process DSR and target data
        const dsrSummary = {
            officeVisits: 0,
            cardsCollected: 0,
            meetings: 0,
            proposals: 0,
            closings: 0
        };

        dsrData.forEach(dsr => {
            dsrSummary.officeVisits += dsr.officeVisits || 0;
            dsrSummary.cardsCollected += dsr.cardsCollected || 0;
            dsrSummary.meetings += dsr.meetings || 0;
            dsrSummary.proposals += dsr.proposals || 0;
            dsrSummary.closings += dsr.closings || 0;
        });

        const targetComparison = targets.map(target => {
            const targetDetails = target.targetDetails;
            const achievedValue = target.achievedValue;

            const calculatePercentage = (achieved, targetValue) => {
                return targetValue > 0 ? Math.min((achieved / targetValue) * 100, 100).toFixed(2) : 0;
            };

            return {
                targetType: target.targetType,
                officeVisits: {
                    target: targetDetails.officeVisits || 0,
                    achieved: achievedValue.officeVisits || 0,
                    percentage: calculatePercentage(achievedValue.officeVisits || 0, targetDetails.officeVisits || 0)
                },
                closings: {
                    target: targetDetails.closings || 0,
                    achieved: achievedValue.closings || 0,
                    percentage: calculatePercentage(achievedValue.closings || 0, targetDetails.closings || 0)
                }
            };
        });

        // 7. Prepare response
        const dashboardData = {
            projectStats,
            ongoingProjects,
            dsrSummary,
            targetComparison
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

module.exports = { getDashboardData };
