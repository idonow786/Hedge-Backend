const cron = require('node-cron');
const { checkAndNotifyRecurringProjects, resetRecurringMailFlag } = require('./Service/recurringProjectNotification');
const { sendRecurringProjectEmail } = require('./Service/sendMail');
const GaapAlert = require('./Model/Gaap/gaap_alerts');

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

// Run at midnight every day
cron.schedule('0 0 * * *', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Find unread alerts from previous days
    const unreadAlerts = await GaapAlert.find({
      isRead: false,
      createdAt: { $lt: yesterday }
    }).populate('user');

    // Process each unread alert
    for (const alert of unreadAlerts) {
      // Reset lastSentAt to allow it to be sent again
      await GaapAlert.findByIdAndUpdate(alert._id, {
        lastSentAt: new Date(0) // Set to past date to ensure it's sent
      });

      // Send email reminder if user has email
      if (alert.user && alert.user.email) {
        await sendRecurringProjectEmail({
          to: alert.user.email,
          subject: 'Unread Alert Reminder',
          text: `You have an unread alert: ${alert.message}`,
          html: `
            <h3>Unread Alert Reminder</h3>
            <p>You have an unread alert:</p>
            <p>${alert.message}</p>
            ${alert.department ? `<p>Department: ${alert.department}</p>` : ''}
            <p>Created on: ${alert.createdAt.toLocaleDateString()}</p>
          `
        });
      }
    }

    console.log('Completed processing unread alerts');
  } catch (error) {
    console.error('Error processing unread alerts:', error);
  }
});

// Test if cron is running
console.log('Scheduler started - waiting for next interval...');
