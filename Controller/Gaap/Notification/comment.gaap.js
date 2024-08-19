const GaapComment = require('../../../Model/Gaap/gaap_comment');
const GaapProject = require('../../../Model/Gaap/gaap_project');
const GaapNotification = require('../../../Model/Gaap/gaap_notification');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const mongoose = require('mongoose');
const multer = require('multer');
const { uploadFileToFirebase } = require('../../../Firebase/uploadFileToFirebase');
const { uploadImageToFirebase } = require('../../../Firebase/uploadImage');

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.addComment = [
  upload.array('attachments', 5),

  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { projectId, content, type } = req.body;
      const userId = req.adminId;
      const user=await GaapUser.findById(req.adminId)

      if (!projectId || !content || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const project = await GaapProject.findById(projectId).session(session);
      if (!project) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Project not found' });
      }

      const attachments = [];
      for (const file of req.files) {
        let url;
        if (file.mimetype.startsWith('image')) {
          const base64Image = file.buffer.toString('base64');
          url = await uploadImageToFirebase(base64Image, file.mimetype);
        } else {
          url = await uploadFileToFirebase(file.buffer, file.originalname);
        }
        attachments.push({ name: file.originalname, url });
      }

      // Create new comment
      const newComment = new GaapComment({
        project: projectId,
        user: userId,
        content,
        type,
        teamId: project.teamId,
        attachments
      });

      await newComment.save({ session });

      // Create notification for project creator
      const notification = new GaapNotification({
        user: project.createdBy,
        message: `New ${type} added to project ${project.projectName}`,
      });

      await notification.save({ session });

      await session.commitTransaction();

      res.status(201).json({
        message: 'Comment added successfully',
        comment: newComment,
        notification
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Error adding comment:', error);
      res.status(500).json({ message: 'Error adding comment', error: error.message });
    } finally {
      session.endSession();
    }
  }
];

exports.getComments = async (req, res) => {
  try {
    const { projectId } = req.query;

    const comments = await GaapComment.find({ project: projectId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.query;
    const { content } = req.body;

    const updatedComment = await GaapComment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.query;

    const deletedComment = await GaapComment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};