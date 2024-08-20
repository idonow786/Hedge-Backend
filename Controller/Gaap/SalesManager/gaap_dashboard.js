const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapDsr = require('../../../Model/Gaap/gaap_dsr');
const GaapSalesTarget = require('../../../Model/Gaap/gaap_salestarget');
const GaapTeam = require('../../../Model/Gaap/gaap_team');

const getDashboardData = async (req, res) => {
    try {
        const adminId = req.adminId;
        const currentDate = new Date();

        // 1. Get team information
        const team = await GaapTeam.findOne({
            $or: [
                { 'parentUser.userId': adminId },
                { 'GeneralUser.userId': adminId },
                { 'members.managerId': adminId }
            ]
        });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found for this admin'
            });
        }

        // 2. Get member IDs
        const memberIds = team.members.map(member => member.memberId);

        // 3. Get projects for these members
        const projects = await GaapProject.find({ createdBy: { $in: memberIds } });

        // 4. Process project data
        const projectStats = {
            total: projects.length,
            ongoing: projects.filter(p => p.status === 'In Progress').length,
            completed: projects.filter(p => p.status === 'Completed').length
        };

        const ongoingProjects = projects.filter(p => p.status === 'In Progress').map(p => ({
            name: p.projectName,
            progress: p.Progress
        }));

        // 5. Get DSR data
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dsrData = await GaapDsr.find({
            user: { $in: memberIds },
            date: { $gte: startOfMonth, $lte: currentDate },
            teamId: team._id
        });

        // 6. Get targets
        const targets = await GaapSalesTarget.find({
            teamId: team._id,
            'targetPeriod.endDate': { $gte: currentDate }
        });

        // 7. Process DSR and target data
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

        // 8. Prepare response
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
