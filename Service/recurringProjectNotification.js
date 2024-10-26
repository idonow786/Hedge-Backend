const GaapProject = require('../Model/Gaap/gaap_project');
const GaapUser = require('../Model/Gaap/gaap_user');
const GaapAlert = require('../Model/Gaap/gaap_alerts');
const GaapNotification = require('../Model/Gaap/gaap_notification');
const GaapTeam = require('../Model/Gaap/gaap_team');
const { sendRecurringProjectEmail } = require('./sendMail');

const checkAndNotifyRecurringProjects = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get date 2 days from now
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        // Find all recurring projects that:
        // 1. Are within 2 days of recurring date
        // 2. Haven't been notified yet
        // 3. Including past due dates
        const recurringProjects = await GaapProject.find({
            recurring: true,
            recurringMail: false,
            RecurringDate: {
                $lte: twoDaysFromNow // Less than or equal to 2 days from now (includes past dates)
            }
        }).populate('customer', 'name companyName');

        // Get all finance managers
        const financeManagers = await GaapUser.find({
            role: 'Finance Manager',
            isActive: true
        });

        // Process each project
        for (const project of recurringProjects) {
            // Get team information
            const team = await GaapTeam.findOne({ _id: project.teamId });
            if (!team) continue;

            // Find relevant users
            const teamFinanceManager = financeManagers.find(fm => fm.teamId === project.teamId);
            const operationManager = await GaapUser.findOne({ _id: team.GeneralUser.userId });
            const adminUser = await GaapUser.findOne({ _id: team.parentUser.userId });

            const formattedDate = new Date(project.RecurringDate).toLocaleDateString();
            
            // Check if the date is past due
            const isPastDue = new Date(project.RecurringDate) < today;
            const urgencyPrefix = isPastDue ? "URGENT: Past due - " : "";
            const notificationMessage = `${urgencyPrefix}Recurring project "${project.projectName}" ${isPastDue ? 'was' : 'is'} due for renewal on ${formattedDate}`;
            
            // Handle Finance Manager notifications
            if (teamFinanceManager) {
                // Send email
                await sendRecurringProjectEmail(
                    teamFinanceManager.email,
                    project.projectName,
                    project.RecurringDate,
                    project.customer.name || project.customer.companyName,
                    project.totalAmount,
                    isPastDue
                );
                console.log('\n=== Recurring Project Notification Details ===');
                console.log('📧 Email:', teamFinanceManager.email);
                console.log('📁 Project:', project.projectName);
                console.log('📅 Recurring Date:', new Date(project.RecurringDate).toLocaleDateString());
                console.log('👤 Customer:', project.customer.name || project.customer.companyName);
                console.log('💰 Amount:', `AED ${project.totalAmount.toLocaleString()}`);
                console.log('⚠️ Past Due:', isPastDue ? 'Yes' : 'No');
                // Create alert
                await GaapAlert.create({
                    user: teamFinanceManager._id,
                    message: `${urgencyPrefix}Recurring project "${project.projectName}" requires financial review. Renewal date: ${formattedDate}`,
                    department: 'Finance'
                });

                // Create notification
                await GaapNotification.create({
                    user: teamFinanceManager._id,
                    message: `${urgencyPrefix}Financial review required for recurring project "${project.projectName}". Renewal date: ${formattedDate}`,
                    department: 'Finance'
                });
            }

            // Handle Operation Manager notifications
            if (operationManager) {
                await GaapNotification.create({
                    user: operationManager._id,
                    message: `${notificationMessage}. Please coordinate with the finance team for review.`,
                    department: 'Operations'
                });
            }

            // Handle Admin notifications
            if (adminUser) {
                await GaapNotification.create({
                    user: adminUser._id,
                    message: `${notificationMessage}. Finance team has been notified for review.`,
                    department: 'Admin'
                });
            }

            // Update project to mark email as sent
            await GaapProject.findByIdAndUpdate(project._id, {
                recurringMail: true
            });

            console.log(`Notifications sent for project: ${project.projectName} (${isPastDue ? 'Past Due' : 'Upcoming'})`);
        }

        return {
            success: true,
            message: `Processed ${recurringProjects.length} recurring projects`
        };

    } catch (error) {
        console.error('Error in recurring project notification:', error);
        throw new Error('Failed to process recurring project notifications');
    }
};

// Reset recurringMail flag for next month's notifications
const resetRecurringMailFlag = async () => {
    try {
        const result = await GaapProject.updateMany(
            { recurring: true, recurringMail: true },
            { recurringMail: false }
        );
        console.log(`Reset recurringMail flag for ${result.modifiedCount} projects`);
    } catch (error) {
        console.error('Error resetting recurringMail flag:', error);
    }
};

module.exports = {
    checkAndNotifyRecurringProjects,
    resetRecurringMailFlag
};
