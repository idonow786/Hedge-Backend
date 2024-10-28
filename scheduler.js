const cron = require('node-cron');
const { checkAndNotifyRecurringProjects, resetRecurringMailFlag } = require('./Service/recurringProjectNotification');

// Run check every 10 seconds with debug logs
cron.schedule('*/10 * * * * *', async () => {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`\n[${currentTime}] Starting recurring project check...`);
    
    try {
        const result = await checkAndNotifyRecurringProjects();
        console.log(`[${currentTime}] Check completed:`, result);
    } catch (error) {
        console.error(`[${currentTime}] Scheduler error:`, error.message);
    }
});

// Run reset check daily at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Checking and resetting recurringMail flags based on payment methods...');
    try {
        await resetRecurringMailFlag();
    } catch (error) {
        console.error('Reset flag error:', error);
    }
});

// Test if cron is running
console.log('Scheduler started - waiting for next interval...');
