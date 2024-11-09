// controllers/documentController.js

const GaapDocument = require('../../../Model/Gaap/gaap_document');
const { uploadFileToFirebase } = require('../../../Firebase/uploadFileToFirebase');
const mongoose = require('mongoose');
const GaapTeam = require('../../../Model/Gaap/gaap_team');

const documentController = {
  addDocument: async (req, res) => {
    try {
      const { projectId } = req.body;
      const files = req.files;
      const userId = req.adminId;

      if (!projectId || !files || files.length === 0) {
        return res.status(400).json({ message: 'Project ID and at least one document are required' });
      }

      // Get user's team
      const userTeam = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': userId },
          { 'GeneralUser.userId': userId },
          { 'members.memberId': userId }
        ]
      });

      if (!userTeam) {
        return res.status(404).json({ 
          success: false, 
          message: 'User does not belong to any team' 
        });
      }

      // Find existing document or create new one
      let document = await GaapDocument.findOne({ 
        project: projectId,
        teamId: userTeam._id // Add teamId to search criteria
      });

      if (!document) {
        // Create new document with teamId
        document = new GaapDocument({
          project: projectId,
          uploadedBy: req.adminId,
          teamId: userTeam._id.toString(), // Convert ObjectId to string
          filePath: []
        });
      }

      // Upload files and add URLs to document
      const uploadPromises = files.map(file => 
        uploadFileToFirebase(file.buffer, file.originalname)
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      document.filePath.push(...uploadedUrls);

      // Save the document
      const savedDocument = await document.save();

      // Return response with populated fields
      const populatedDocument = await GaapDocument.findById(savedDocument._id)
        .populate('project', 'projectName')
        .populate('uploadedBy', 'fullName email');

      res.status(201).json({
        success: true,
        message: 'Document added successfully',
        document: populatedDocument
      });

    } catch (error) {
      console.error('Error in addDocument:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error adding document', 
        error: error.message
      });
    }
  },

  getDocuments: async (req, res) => {
    try {
      const { projectId } = req.query;
      const userId = req.adminId;

      // Find user's team
      const userTeam = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': userId },
          { 'GeneralUser.userId': userId },
          { 'members.memberId': userId }
        ]
      });

      if (!userTeam) {
        return res.status(404).json({
          success: false,
          message: 'User does not belong to any team'
        });
      }

      // Build query using teamId
      let query = {
        teamId: userTeam._id // Use teamId instead of checking all team members
      };

      if (projectId) {
        query.project = projectId;
      }

      // Get documents
      const documents = await GaapDocument.find(query)
        .populate('project', 'projectName')
        .populate('uploadedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        teamId: userTeam._id,
        teamName: userTeam.teamName,
        documents: documents,
        count: documents.length
      });

    } catch (error) {
      console.error('Error in getDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching documents',
        error: error.message
      });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      const { projectId, index } = req.body;

      if (!projectId || index === undefined) {
        return res.status(400).json({ message: 'Project ID and index are required' });
      }

      const document = await GaapDocument.findOne({ project: projectId });

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (index < 0 || index >= document.filePath.length) {
        return res.status(400).json({ message: 'Invalid index' });
      }

      document.filePath.splice(index, 1);

      if (document.filePath.length === 0) {
        await GaapDocument.findByIdAndDelete(document._id);
        return res.json({ message: 'Document deleted successfully' });
      }

      await document.save();

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
  }
};

module.exports = documentController;