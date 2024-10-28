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

        console.log('Searching for projects with:');
        console.log('- Today:', today.toLocaleDateString());
        console.log('- Two days from now:', twoDaysFromNow.toLocaleDateString());

        // Updated query to include approval checks
        const recurringProjects = await GaapProject.find({
            recurring: true,
            recurringMail: false,
            customerApproval: true,
            salesManagerApproval: true,
            RecurringDate: {
                $lte: twoDaysFromNow
            }
        }).populate('customer', 'name companyName');

        console.log(`Found ${recurringProjects.length} projects to process`);

        if (recurringProjects.length === 0) {
            return {
                success: true,
                message: 'No projects require notification at this time'
            };
        }

        // Get all finance managers
        const financeManagers = await GaapUser.find({
            role: 'Finance Manager',
            isActive: true
        });

        // Process each project
        for (const project of recurringProjects) {
            console.log(`\nProcessing project: ${project.projectName}`);
            
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
                // Create alert and notification
                await GaapAlert.create({
                    user: teamFinanceManager._id,
                    message: `${urgencyPrefix}Recurring project "${project.projectName}" requires financial review. Renewal date: ${formattedDate}`,
                    department: 'Finance'
                });

                await GaapNotification.create({
                    user: teamFinanceManager._id,
                    message: `${urgencyPrefix}Financial review required for recurring project "${project.projectName}". Renewal date: ${formattedDate}`,
                    department: 'Finance'
                });
            }

            // Handle Operation Manager notifications
            if (operationManager) {
                // Create alert
                await GaapAlert.create({
                    user: operationManager._id,
                    message: `${notificationMessage}. Please coordinate with the finance team for review.`,
                    department: 'Operations'
                });

                // Create notification
                await GaapNotification.create({
                    user: operationManager._id,
                    message: `${notificationMessage}. Please coordinate with the finance team for review.`,
                    department: 'Operations'
                });
            }

            // Handle Admin notifications
            if (adminUser) {
                // Create alert
                await GaapAlert.create({
                    user: adminUser._id,
                    message: `${notificationMessage}. Finance team has been notified for review.`,
                    department: 'Admin'
                });

                // Create notification
                await GaapNotification.create({
                    user: adminUser._id,
                    message: `${notificationMessage}. Finance team has been notified for review.`,
                    department: 'Admin'
                });
            }

            // Update RecurringDate based on payment method
            const currentRecurringDate = new Date(project.RecurringDate);
            let nextRecurringDate = new Date(currentRecurringDate);

            switch (project.RecurringPaymentMethod) {
                case 'Weekly':
                    nextRecurringDate.setDate(currentRecurringDate.getDate() + 7);
                    break;
                case 'Monthly':
                    nextRecurringDate.setMonth(currentRecurringDate.getMonth() + 1);
                    break;
                case 'Quarterly':
                    nextRecurringDate.setMonth(currentRecurringDate.getMonth() + 3);
                    break;
            }

            // Update project with new recurring date and reset mail flag
            await GaapProject.findByIdAndUpdate(project._id, {
                recurringMail: true,
                RecurringDate: nextRecurringDate
            });

            console.log(`Updated next recurring date for ${project.projectName} to ${nextRecurringDate.toLocaleDateString()}`);
        }

        return {
            success: true,
            message: `Successfully processed ${recurringProjects.length} recurring projects`
        };

    } catch (error) {
        console.error('Detailed error in recurring project notification:', error);
        throw new Error(`Failed to process recurring project notifications: ${error.message}`);
    }
}

// Updated reset function to handle different payment methods
const resetRecurringMailFlag = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all recurring projects
        const recurringProjects = await GaapProject.find({
            recurring: true,
            recurringMail: true
        });

        let resetCount = 0;
        for (const project of recurringProjects) {
            const lastRecurringDate = new Date(project.RecurringDate);
            let shouldReset = false;

            switch (project.RecurringPaymentMethod) {
                case 'Weekly':
                    // Reset if 7 days have passed since last recurring date
                    const weekDiff = Math.floor((today - lastRecurringDate) / (1000 * 60 * 60 * 24));
                    shouldReset = weekDiff >= 7;
                    break;

                case 'Monthly':
                    // Reset if we're in a new month from the last recurring date
                    shouldReset = 
                        today.getMonth() !== lastRecurringDate.getMonth() ||
                        today.getFullYear() !== lastRecurringDate.getFullYear();
                    break;

                case 'Quarterly':
                    // Reset if 3 months have passed since last recurring date
                    const monthDiff = 
                        (today.getFullYear() - lastRecurringDate.getFullYear()) * 12 +
                        (today.getMonth() - lastRecurringDate.getMonth());
                    shouldReset = monthDiff >= 3;
                    break;
            }

            if (shouldReset) {
                await GaapProject.findByIdAndUpdate(project._id, {
                    recurringMail: false
                });
                resetCount++;
                console.log(`Reset mail flag for project ${project.projectName} (${project.RecurringPaymentMethod})`);
            }
        }

        console.log(`Reset recurringMail flag for ${resetCount} projects`);
    } catch (error) {
        console.error('Error resetting recurringMail flag:', error);
    }
};

module.exports = {
    checkAndNotifyRecurringProjects,
    resetRecurringMailFlag
};
