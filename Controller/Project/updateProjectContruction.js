const ProjectC = require('../../Model/projectConstruction');
const Wallet = require('../../Model/Wallet');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');
const mongoose = require('mongoose');

const updateProjectConstruction = async (req, res) => {
  try {
    const { projectId } = req.query;
    const adminId = req.adminId;
    const projectData = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await ProjectC.findOne({ _id: projectId, adminId: adminId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized' });
    }

    // Store old project data for wallet update
    const oldProjectData = project.toObject();

    // Helper function to safely parse JSON
    const safeParse = (value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    };

    // Helper function to update nested objects
    const updateNestedObject = (obj, path, value) => {
      const keys = path.split('.');
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    };

    // Update fields
    Object.keys(projectData).forEach(key => {
      if (key !== 'documentation') {
        switch (key) {
          case 'projectName':
          case 'projectDescription':
          case 'adminId':
            project[key] = projectData[key];
            break;
          case 'clientId':
            project[key] = new mongoose.Types.ObjectId(projectData[key]);
            break;
          case 'startDate':
          case 'estimatedCompletionDate':
            project[key] = projectData[key] ? new Date(projectData[key]) : null;
            break;
          case 'projectLocation':
          case 'budget':
          case 'projectScope':
          case 'projectTeam':
          case 'timeline':
          case 'communication':
            Object.keys(projectData[key]).forEach(subKey => {
              updateNestedObject(project[key], subKey, safeParse(projectData[key][subKey]));
            });
            break;
          case 'risks':
          case 'resources':
            project[key] = safeParse(projectData[key]).map(item => {
              if (item._id) {
                item._id = new mongoose.Types.ObjectId(item._id);
              }
              return item;
            });
            break;
          default:
            project[key] = safeParse(projectData[key]);
        }
      }
    });

    // Handle file uploads (if any)
    if (req.files) {
      project.documentation = project.documentation || {};
      for (const [fieldName, files] of Object.entries(req.files)) {
        const docType = fieldName.split('[')[1].split(']')[0];
        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const url = await uploadFileToFirebase(file.buffer, file.originalname);
            return url;
          })
        );
        project.documentation[docType] = (project.documentation[docType] || []).concat(uploadedUrls);
      }
    }

    const updatedProject = await project.save();

    // Update wallet
    await updateWallet(adminId, oldProjectData, updatedProject.toObject());

    res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', details: error.message });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const updateWallet = async (adminId, oldProjectData, newProjectData) => {
  try {
    let wallet = await Wallet.findOne({ AdminID: adminId });
    
    if (!wallet) {
      wallet = new Wallet({ AdminID: adminId });
    }

    // Calculate old expenses
    let oldExpenses = 0;
    if (oldProjectData.budget && oldProjectData.budget.costBreakdown) {
      oldExpenses = Object.values(oldProjectData.budget.costBreakdown).reduce((sum, cost) => sum + Number(cost), 0);
    }
    if (oldProjectData.resources) {
      oldExpenses += oldProjectData.resources.reduce((sum, resource) => {
        return sum + (Number(resource.quantity) * Number(resource.unitCost));
      }, 0);
    }

    // Calculate new expenses
    let newExpenses = 0;
    if (newProjectData.budget && newProjectData.budget.costBreakdown) {
      newExpenses = Object.values(newProjectData.budget.costBreakdown).reduce((sum, cost) => sum + Number(cost), 0);
    }
    if (newProjectData.resources) {
      newExpenses += newProjectData.resources.reduce((sum, resource) => {
        return sum + (Number(resource.quantity) * Number(resource.unitCost));
      }, 0);
    }

    // Update wallet
    wallet.TotalExpenses = (Number(wallet.TotalExpenses) - oldExpenses + newExpenses).toString();
    
    // Recalculate Profit
    wallet.Profit = (Number(wallet.TotalRevenue) - Number(wallet.TotalExpenses)).toString();

    await wallet.save();
  } catch (error) {
    console.error('Error updating wallet:', error);
  }
};

module.exports = { updateProjectConstruction };
