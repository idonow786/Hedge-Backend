const express = require('express');
const router = express.Router();
const commentController = require('../../Controller/Gaap/Notification/comment.gaap');
const {
    getUserNotifications,
    markNotificationAsRead
} = require('../../Controller/Gaap/Notification/notification.gaap');
const { verifyToken } = require('../../Middleware/jwt');

router.post('/add', verifyToken, commentController.addComment);
router.get('/project', verifyToken, commentController.getComments);
router.put('project', verifyToken, commentController.updateComment);
router.delete('project', verifyToken, commentController.deleteComment);





router.put('/notification-mark', verifyToken, markNotificationAsRead);
router.get('/get-notification', verifyToken,   getUserNotifications);


module.exports = router;