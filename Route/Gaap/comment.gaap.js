const express = require('express');
const router = express.Router();
const commentController = require('../../Controller/Gaap/Notification/comment.gaap');
const { verifyToken } = require('../../Middleware/jwt');

router.post('/add', verifyToken, commentController.addComment);
router.get('/project', verifyToken, commentController.getComments);
router.put('project', verifyToken, commentController.updateComment);
router.delete('project', verifyToken, commentController.deleteComment);

module.exports = router;