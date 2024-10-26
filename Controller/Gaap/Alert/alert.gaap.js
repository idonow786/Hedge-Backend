const mongoose = require('mongoose');
const GaapAlert = require('../../../Model/Gaap/gaap_alerts');
const GaapTeam = require('../../../Model/Gaap/gaap_team');
const GaapUser = require('../../../Model/Gaap/gaap_user');

// Get alerts for current user
const getUserAlerts = async (req, res) => {
  try {
    const userId = req.adminId;

    const alerts = await GaapAlert.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

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

    const updatedAlert = await GaapAlert.findOneAndUpdate(
      { _id: alertId, user: userId },
      { isRead: true },
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
