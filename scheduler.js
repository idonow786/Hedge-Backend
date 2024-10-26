const cron = require('node-cron');
const { checkAndNotifyRecurringProjects, resetRecurringMailFlag } = require('./Service/recurringProjectNotification');

// Run check every day at 9 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running recurring project notification check...');
    try {
        await checkAndNotifyRecurringProjects();
    } catch (error) {
        console.error('Scheduler error:', error);
    }
});

// Reset recurringMail flag on the first day of each month at 1 AM
cron.schedule('0 1 1 * *', async () => {
    console.log('Resetting recurringMail flags...');
    try {
        await resetRecurringMailFlag();
    } catch (error) {
        console.error('Reset flag error:', error);
    }
});
