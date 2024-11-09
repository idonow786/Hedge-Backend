const GaapProject = require('../Model/Gaap/gaap_project');
const GaapUser = require('../Model/Gaap/gaap_user');
const GaapAlert = require('../Model/Gaap/gaap_alerts');
const GaapNotification = require('../Model/Gaap/gaap_notification');
const GaapTeam = require('../Model/Gaap/gaap_team');
const { sendRecurringProjectEmail } = require('./sendMail');

const getAdditionalManagersByProjectType = async (projectType, teamId) => {
    let roles = [];
    
    // Map project types to corresponding manager roles
    switch(projectType) {
        case 'External Audit':
        case 'Audit & Assurance':
        case 'ICV+external Audit':
            roles = ['Audit Manager'];
            break;
            
        case 'ICV':
        case 'ICV+external Audit':
            roles = ['ICV Manager'];
            break;
            
        case 'Taxation':
        case 'VAT Registration':
        case 'ESR Registration':
        case 'ESR Filing':
            roles = ['Tax Supervisor'];
            break;
            
        case 'Book keeping':
            roles = ['Accounting Manager'];
            break;
    }
    
    if (roles.length === 0) return [];

    // Get all active managers for these roles
    const managers = await GaapUser.find({
        role: { $in: roles },
        isActive: true,
        teamId: teamId
    });
    
    return managers;
};

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

        // Process each project
        for (const project of recurringProjects) {
            console.log(`\nProcessing project: ${project.projectName}`);
            
            // Get team information with null check
            const team = await GaapTeam.findOne({ _id: project.teamId });
            if (!team) {
                console.log(`No team found for project: ${project.projectName}`);
                continue;
            }

            // Find users by their _id in the team
            const financeManager = team.members.find(member => 
                member.role === 'Finance Manager'
            )?.memberId;

            const operationManager = team.GeneralUser?.userId;
            const adminUser = team.parentUser?.userId;

            // Get user objects if IDs exist
            const [financeManagerUser, operationManagerUser, adminUserObj] = await Promise.all([
                financeManager ? GaapUser.findOne({ 
                    _id: financeManager,
                    role: 'Finance Manager',
                    isActive: true 
                }) : null,
                operationManager ? GaapUser.findOne({ 
                    _id: operationManager,
                    role: 'Operation Manager',
                    isActive: true 
                }) : null,
                adminUser ? GaapUser.findOne({ 
                    _id: adminUser,
                    role: 'admin',
                    isActive: true 
                }) : null
            ]);

            const formattedDate = new Date(project.RecurringDate).toLocaleDateString();
            const isPastDue = new Date(project.RecurringDate) < today;
            const urgencyPrefix = isPastDue ? "URGENT: Past due - " : "";
            const notificationMessage = `${urgencyPrefix}Recurring project "${project.projectName}" ${isPastDue ? 'was' : 'is'} due for renewal on ${formattedDate}`;

            // Handle Finance Manager notifications if exists
            if (financeManagerUser) {
                await sendRecurringProjectEmail(
                    financeManagerUser.email,
                    project.projectName,
                    project.RecurringDate,
                    project.customer.name || project.customer.companyName,
                    project.totalAmount,
                    isPastDue
                );

                await GaapAlert.create({
                    user: financeManagerUser._id,
                    message: `${urgencyPrefix}Recurring project "${project.projectName}" requires financial review. Renewal date: ${formattedDate}`,
                    department: 'Finance',
                    lastSentAt: new Date(),
                    sendCount: 1,
                    isRead: false
                });

                await GaapNotification.create({
                    user: financeManagerUser._id,
                    message: `${urgencyPrefix}Financial review required for project "${project.projectName}". Renewal date: ${formattedDate}`,
                    department: 'Finance'
                });
            }

            // Handle Operation Manager notifications
            if (operationManagerUser) {
                await GaapAlert.create({
                    user: operationManagerUser._id,
                    message: `${notificationMessage}. Please coordinate with the team for review.`,
                    department: 'Operations',
                    lastSentAt: new Date(),
                    sendCount: 1,
                    isRead: false
                });

                await GaapNotification.create({
                    user: operationManagerUser._id,
                    message: `${notificationMessage}. Please coordinate with the team for review.`,
                    department: 'Operations'
                });
            }

            // Handle Admin notifications
            if (adminUserObj) {
                await GaapAlert.create({
                    user: adminUserObj._id,
                    message: `${notificationMessage}. Team has been notified for review.`,
                    department: 'Admin',
                    lastSentAt: new Date(),
                    sendCount: 1,
                    isRead: false
                });

                await GaapNotification.create({
                    user: adminUserObj._id,
                    message: `${notificationMessage}. Team has been notified for review.`,
                    department: 'Admin'
                });
            }

            // Get additional managers based on project type
            const additionalManagers = await getAdditionalManagersByProjectType(project.projectType, project.teamId);

            // Handle additional managers based on project type
            for (const manager of additionalManagers) {
                await sendRecurringProjectEmail(
                    manager.email,
                    project.projectName,
                    project.RecurringDate,
                    project.customer.name || project.customer.companyName,
                    project.totalAmount,
                    isPastDue
                );

                await GaapAlert.create({
                    user: manager._id,
                    message: `${urgencyPrefix}Recurring ${project.projectType} project "${project.projectName}" requires review. Renewal date: ${formattedDate}`,
                    department: project.department,
                    lastSentAt: new Date(),
                    sendCount: 1,
                    isRead: false
                });

                await GaapNotification.create({
                    user: manager._id,
                    message: `${urgencyPrefix}Review required for recurring ${project.projectType} project "${project.projectName}". Renewal date: ${formattedDate}`,
                    department: project.department
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
                case 'Yearly':
                    nextRecurringDate.setFullYear(currentRecurringDate.getFullYear() + 1);
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

                case 'Yearly':
                    const yearDiff = today.getFullYear() - lastRecurringDate.getFullYear();
                    shouldReset = yearDiff >= 1;
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
