const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapSalesTarget = require('../../../Model/Gaap/gaap_salestarget');
const GaapDsr = require('../../../Model/Gaap/gaap_dsr');
const GaapProjectProduct = require('../../../Model/Gaap/gaap_product');
const GaapTeam = require('../../../Model/Gaap/gaap_team');

const generateDashboard = async (req, res) => {
    try {
        const adminId = req.adminId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Find the team and check if the admin is a member
        const team = await GaapTeam.findOne({
            'members.memberId': adminId
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found for this admin' });
        }

        const adminMember = team.members.find(member => member.memberId.toString() === adminId);
        if (!adminMember) {
            return res.status(403).json({ message: 'Admin not found in the team' });
        }

        const managerId = adminMember.managerId;

        // 1. Sales Targets
        const salesTargets = await GaapSalesTarget.find({
            createdBy: managerId,
            'targetPeriod.endDate': { $gte: today }
        });

        // Initialize target data structure
        const targetData = {
            daily: { officeVisits: {}, closings: {} },
            monthly: { officeVisits: {}, closings: {} },
            quarterly: { officeVisits: {}, closings: {} },
            yearly: { officeVisits: {}, closings: {} }
        };

        // Populate target data
        for (let period in targetData) {
            const target = salesTargets.find(t => t.targetType.toLowerCase() === period);
            if (target) {
                targetData[period].officeVisits.target = target.targetDetails.officeVisits || 0;
                targetData[period].closings.target = target.targetDetails.closings || 0;
            }
        }

        // Fetch DSRs for different periods
        const yearDsrs = await GaapDsr.find({ user: adminId, date: { $gte: startOfYear, $lte: today } });
        const quarterDsrs = yearDsrs.filter(dsr => dsr.date >= startOfQuarter);
        const monthDsrs = quarterDsrs.filter(dsr => dsr.date >= startOfMonth);
        const todayDsr = monthDsrs.find(dsr => dsr.date.toDateString() === today.toDateString());

        // Calculate achieved values
        targetData.yearly.officeVisits.achieved = yearDsrs.reduce((sum, dsr) => sum + (dsr.officeVisits || 0), 0);
        targetData.quarterly.officeVisits.achieved = quarterDsrs.reduce((sum, dsr) => sum + (dsr.officeVisits || 0), 0);
        targetData.monthly.officeVisits.achieved = monthDsrs.reduce((sum, dsr) => sum + (dsr.officeVisits || 0), 0);
        targetData.daily.officeVisits.achieved = todayDsr ? todayDsr.officeVisits || 0 : 0;

        // Calculate percentages
        for (let period in targetData) {
            for (let metric in targetData[period]) {
                targetData[period][metric].percentage = targetData[period][metric].target ? 
                    (targetData[period][metric].achieved / targetData[period][metric].target) * 100 : 0;
            }
        }

        // 2. Projects Overview
        const projects = await GaapProject.find({ 
            createdBy: adminId,
            status: { $ne: 'Cancelled' }
        });
        const projectsOverview = {
            total: projects.length,
            ongoing: projects.filter(p => p.status === 'In Progress').length,
            completed: projects.filter(p => p.status === 'Completed').length
        };

        // Calculate percentage of each ongoing project
        const ongoingProjects = projects.filter(p => p.status === 'In Progress').map(p => ({
            id: p._id,
            name: p.projectName,
            progress: p.Progress || 0
        }));

        // 3. Recent DSRs
        const recentDsrs = await GaapDsr.find({ user: adminId })
            .sort({ date: -1 })
            .limit(5);

        // 4. DSR Summary
        const dsrSummary = {
            totalOfficeVisits: targetData.monthly.officeVisits.achieved,
            totalCardsCollected: monthDsrs.reduce((sum, dsr) => sum + (dsr.cardsCollected || 0), 0),
            totalMeetings: monthDsrs.reduce((sum, dsr) => sum + (dsr.meetings || 0), 0),
            totalProposals: monthDsrs.reduce((sum, dsr) => sum + (dsr.proposals || 0), 0)
        };

        // 5. Project Behavior
        const projectBehavior = await GaapProject.find({ createdBy: adminId, status: 'In Progress' })
            .select('projectName Progress')
            .sort({ updatedAt: -1 })
            .limit(5);

        // 6. Quotations (Proposals)
        const quotations = await GaapProjectProduct.countDocuments({ 
            project: { $in: projects.map(p => p._id) } 
        });

        // 7. Closings (Approved projects with 50% payment)
        const closings = await GaapProject.countDocuments({
            createdBy: adminId,
            status: 'Approved',
            'payments.amount': { $gte: { $multiply: ['$totalAmount', 0.5] } }
        });

        res.json({
            salesTargets: targetData,
            projectsOverview,
            ongoingProjects,
            dsrSummary,
            recentDsrs,
            projectBehavior,
            quotations,
            closings
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating dashboard', error: error.message });
    }
};

module.exports = { generateDashboard };
