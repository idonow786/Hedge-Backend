// controllers/documentController.js

const GaapDocument = require('../../../Model/Gaap/gaap_document');
const { uploadFileToFirebase } = require('../../../Firebase/uploadFileToFirebase');
const mongoose = require('mongoose');

const documentController = {
  addDocument: async (req, res) => {
    try {
      const { projectId } = req.body;
      const files = req.files;

      if (!projectId || !files || files.length === 0) {
        return res.status(400).json({ message: 'Project ID and at least one document are required' });
      }

      let document = await GaapDocument.findOne({ project: projectId });

      if (!document) {
        document = new GaapDocument({
          project: projectId,
          uploadedBy: req.adminId,
          filePath: []
        });
      }

      for (const file of files) {
        const url = await uploadFileToFirebase(file.buffer, file.originalname);
        document.filePath.push(url);
      }

      await document.save();

      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: 'Error adding document', error: error.message });
    }
  },

  getDocuments: async (req, res) => {
    try {
      const { projectId } = req.query;

      let query = { uploadedBy: req.adminId };
      if (projectId) {
        query.project = projectId;
      }

      const documents = await GaapDocument.find(query).populate('project', 'projectName');

      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching documents', error: error.message });
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