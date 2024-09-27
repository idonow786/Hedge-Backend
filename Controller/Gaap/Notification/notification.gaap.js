// controllers/notificationController.js

const mongoose = require('mongoose');
const GaapNotification = require('../../../Model/Gaap/gaap_notification');
const GaapTeam = require('../../../Model/Gaap/gaap_team');
const GaapUser = require('../../../Model/Gaap/gaap_user');

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.adminId; // Current user's ID
    const role = req.role; // Current user's role

    // Fetch the current user to get department and teamId
    const user = await GaapUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const department = user.department;
    const teamId = user.teamId;

    let notifications = [];

    if (role === 'admin' || role === 'Operation Manager') {
      // Find the team where the user is the parentUser or GeneralUser
      const teams = await GaapTeam.find({
        $or: [
          { 'parentUser.userId': userId },
          { 'GeneralUser.userId': userId }
        ]
      });

      if (teams.length === 0) {
        return res.status(404).json({ message: 'No teams found for the user' });
      }

      // Get all user IDs from the team(s)
      let teamMemberIds = [];
      teams.forEach(team => {
        teamMemberIds = teamMemberIds.concat(getTeamMemberIds(team));
      });

      // Remove duplicates
      teamMemberIds = [...new Set(teamMemberIds)];

      // Fetch notifications where user is in teamMemberIds
      notifications = await GaapNotification.find({ user: { $in: teamMemberIds } })
        .sort({ createdAt: -1 })
        .lean();

    } else if (role === 'Sales Executive' || role === 'Sales Manager') {
      // Fetch notifications for the current user only
      notifications = await GaapNotification.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();

    } else if (role === 'Finance Manager') {
      // Find the team where the user is a member with role 'Finance Manager'
      const teams = await GaapTeam.find({
        'members': {
          $elemMatch: {
            memberId: userId,
            role: 'Finance Manager'
          }
        }
      });

      if (teams.length === 0) {
        return res.status(404).json({ message: 'No teams found for the Finance Manager' });
      }

      // Get all user IDs from the team(s)
      let teamMemberIds = [];
      teams.forEach(team => {
        teamMemberIds = teamMemberIds.concat(getTeamMemberIds(team));
      });

      // Remove duplicates
      teamMemberIds = [...new Set(teamMemberIds)];

      // Fetch notifications where user is in teamMemberIds
      notifications = await GaapNotification.find({ user: { $in: teamMemberIds } })
        .sort({ createdAt: -1 })
        .lean();

    } else if (role === 'ICV Manager' || role === 'Audit Manager') {
      // Fetch notifications where department matches user's department
      let targetDepartment = role === 'ICV Manager' ? 'ICV' : 'Audit';

      notifications = await GaapNotification.find({ department: targetDepartment })
        .sort({ createdAt: -1 })
        .lean();

    } else {
      // For other roles, fetch notifications for the current user only
      notifications = await GaapNotification.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
    }

    res.status(200).json({
      message: 'Notifications fetched successfully',
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Helper function to get all user IDs from a team
const getTeamMemberIds = (team) => {
  let teamMemberIds = team.members.map(member => member.memberId);

  if (team.parentUser && team.parentUser.userId) {
    teamMemberIds.push(team.parentUser.userId);
  }

  if (team.GeneralUser && team.GeneralUser.userId) {
    teamMemberIds.push(team.GeneralUser.userId);
  }

  // Ensure all IDs are strings for consistent comparison
  teamMemberIds = teamMemberIds.map(id => id.toString());

  return teamMemberIds;
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