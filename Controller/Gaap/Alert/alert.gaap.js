const mongoose = require('mongoose');
const GaapAlert = require('../../../Model/Gaap/gaap_alerts');
const GaapTeam = require('../../../Model/Gaap/gaap_team');
const GaapUser = require('../../../Model/Gaap/gaap_user');

// Get alerts for current user
const getUserAlerts = async (req, res) => {
  try {
    const userId = req.adminId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Get alerts that:
    // 1. Haven't been sent today OR
    // 2. Are unread from previous days AND
    // 3. Either have no remindAt date OR remindAt date is in the past
    const alerts = await GaapAlert.find({
      user: userId,
      $or: [
        { lastSentAt: { $lt: today } },
        { isRead: false }
      ],
      $and: [
        {
          $or: [
            { remindAt: null },
            { remindAt: { $lte: now } }
          ]
        }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Update lastSentAt and sendCount for retrieved alerts
    await Promise.all(alerts.map(alert => 
      GaapAlert.findByIdAndUpdate(alert._id, {
        lastSentAt: new Date(),
        $inc: { sendCount: 1 }
      })
    ));

    res.status(200).json({
      message: 'Alerts fetched successfully',
      data: alerts
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error while fetching alerts' });
  }
};

// Mark alert as read
const markAlertAsRead = async (req, res) => {
  try {
    const userId = req.adminId;
    const { alertId } = req.query;
    const { event } = req.body;

    let updateData = {};
    
    if (event === 'done') {
      updateData = { 
        isRead: true,
        remindAt: null  // Clear any reminder when marked as done
      };
    } else if (event === 'remind') {
      // Set reminder for tomorrow at the same time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateData = { 
        lastSentAt: new Date(),
        remindAt: tomorrow
      };
    }

    const updatedAlert = await GaapAlert.findOneAndUpdate(
      { _id: alertId, user: userId },
      updateData,
      { new: true }
    );

    if (!updatedAlert) {
      return res.status(404).json({ message: 'Alert not found or not authorized' });
    }

    res.status(200).json({
      message: 'Alert marked as read',
      data: updatedAlert
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Server error while updating alert' });
  }
};

module.exports = {
  getUserAlerts,
  markAlertAsRead
};
