const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapSalesTarget = require('../../../Model/Gaap/gaap_salestarget');
const GaapDsr = require('../../../Model/Gaap/gaap_dsr');
const GaapProjectProduct = require('../../../Model/Gaap/gaap_product');

const generateDashboard = async (req, res) => {
    try {
        const userId = req.adminId;
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Sales Targets
        const salesTargets = await GaapSalesTarget.find({ user: userId });
        const targetData = {
            daily: salesTargets.find(t => t.targetType === 'Daily') || { targetValue: 0, achievedValue: 0 },
            monthly: salesTargets.find(t => t.targetType === 'Monthly') || { targetValue: 0, achievedValue: 0 },
            quarterly: salesTargets.find(t => t.targetType === 'Quarterly') || { targetValue: 0, achievedValue: 0 },
            yearly: salesTargets.find(t => t.targetType === 'Yearly') || { targetValue: 0, achievedValue: 0 }
        };

        // Calculate percentages
        for (let period in targetData) {
            targetData[period].percentage = (targetData[period].achievedValue / targetData[period].targetValue) * 100 || 0;
        }

        // 2. Projects Overview
        const projects = await GaapProject.find({ salesPerson: userId });
        const projectsOverview = {
            total: projects.length,
            ongoing: projects.filter(p => p.status === 'In Progress').length,
            completed: projects.filter(p => p.status === 'Completed').length
        };

        // Calculate percentage of each ongoing project
        const ongoingProjects = projects.filter(p => p.status === 'In Progress').map(p => ({
            id: p._id,
            name: p.projectName,
            progress: p.Progress
        }));

        // 3. Recent DSRs
        const recentDsrs = await GaapDsr.find({ user: userId })
            .sort({ date: -1 })
            .limit(5);

        // 4. DSR Summary (calculated from recent DSRs)
        const dsrSummary = recentDsrs.reduce((sum, dsr) => {
            sum.totalOfficeVisits += dsr.officeVisits || 0;
            sum.totalCardsCollected += dsr.cardsCollected || 0;
            sum.totalMeetings += dsr.meetings || 0;
            sum.totalProposals += dsr.proposals || 0;
            return sum;
        }, {
            totalOfficeVisits: 0,
            totalCardsCollected: 0,
            totalMeetings: 0,
            totalProposals: 0
        });

        // 5. Project Behavior
        const projectBehavior = await GaapProject.find({ salesPerson: userId, status: 'In Progress' })
            .select('projectName Progress')
            .sort({ updatedAt: -1 })
            .limit(5);

        // 6. Quotations (Proposals)
        const quotations = await GaapProjectProduct.find({ 
            project: { $in: projects.map(p => p._id) } 
        }).countDocuments();

        // 7. Closings (Approved projects with 50% payment)
        const closings = await GaapProject.countDocuments({
            salesPerson: userId,
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