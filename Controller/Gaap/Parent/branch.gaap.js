const GaapBranch = require('../../../Model/Gaap/gaap_branch');
const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../Model/Gaap/gaap_team');

// Create a new branch
const createBranch = async (req, res) => {
  try {
    const { branchName, location } = req.body;

    // Check if branch name already exists
    const existingBranch = await GaapBranch.findOne({ branchName });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch name already exists' });
    }

    const newBranch = new GaapBranch({
      branchName,
      location,
      adminId: req.adminId
    });

    await newBranch.save();

    res.status(201).json({ 
      message: 'Branch created successfully',
      branch: newBranch
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ message: 'Server error during branch creation' });
  }
};

// Get all branches
const getAllBranches = async (req, res) => {
  try {
    const user = await GaapUser.findById(req.adminId);
    let branchId;
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Find team where user is either parentUser or GeneralUser
    const team = await GaapTeam.findOne({
      $or: [
        { 'parentUser.userId': req.adminId },
        { 'GeneralUser': { $elemMatch: { userId: req.adminId } } }

      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found for this user' });
    }

    if (req.role !== 'admin' && req.role !== 'Audit Manager') {
      branchId = user.branchId;
    }

    // Create query object with optional branchId
    const query = {
      adminId: team.parentUser.userId,
      ...(branchId && { _id: branchId })
    };

    const branches = await GaapBranch.find(query)
      .populate('users', 'fullName email role');

    res.status(200).json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Server error while fetching branches' });
  }
};

// Get single branch
const getBranch = async (req, res) => {
  try {
    const branch = await GaapBranch.findOne({
      _id: req.params.branchId,
      adminId: req.adminId
    }).populate('users', 'fullName email role');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.status(200).json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ message: 'Server error while fetching branch' });
  }
};

// Update branch
const updateBranch = async (req, res) => {
  try {
    const { branchName, location } = req.body;

    // Check if new branch name already exists (excluding current branch)
    if (branchName) {
      const existingBranch = await GaapBranch.findOne({
        branchName,
        _id: { $ne: req.params.branchId }
      });
      if (existingBranch) {
        return res.status(400).json({ message: 'Branch name already exists' });
      }
    }

    const branch = await GaapBranch.findOneAndUpdate(
      { _id: req.params.branchId, adminId: req.adminId },
      { $set: { branchName, location } },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.status(200).json({
      message: 'Branch updated successfully',
      branch
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Server error while updating branch' });
  }
};

// Delete branch
const deleteBranch = async (req, res) => {
  try {
    // Check if branch has users
    const branch = await GaapBranch.findOne({
      _id: req.params.branchId,
      adminId: req.adminId
    });

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    if (branch.users.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete branch with assigned users. Please reassign users first.'
      });
    }

    await GaapBranch.findOneAndDelete({
      _id: req.params.branchId,
      adminId: req.adminId
    });

    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ message: 'Server error while deleting branch' });
  }
};

module.exports = {
  createBranch,
  getAllBranches,
  getBranch,
  updateBranch,
  deleteBranch
}; 