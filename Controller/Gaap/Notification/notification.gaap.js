const GaapNotification = require('../../../Model/Gaap/gaap_notification');

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.adminId;
    console.log(req.adminId)
    console.log(await GaapNotification.find())

    const notifications = await GaapNotification.find({ user: userId })
    // const notifications = await GaapNotification.find()
      .sort({ createdAt: -1 }) 
      .lean(); 

    res.status(200).json({
      message: 'Notifications fetched successfully',
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Controller to mark a notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.adminId;
    const { notificationId } = req.query;

    const updatedNotification = await GaapNotification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found or not authorized' });
    }

    res.status(200).json({
      message: 'Notification marked as read',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead
};