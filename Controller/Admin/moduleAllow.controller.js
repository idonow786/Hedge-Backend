const ModuleAllow = require('../../Model/ModuleAllow');

// 📝 Create new module permission
const createModuleAllow = async (req, res) => {
  try {
    const { moduleName, userId, permission } = req.body;
    
    // 🔍 Check if entry already exists
    const existingModule = await ModuleAllow.findOne({ userId });
    if (existingModule) {
      return res.status(400).json({ message: '❌ Module permissions already exist for this user' });
    }

    const newModuleAllow = new ModuleAllow({
      moduleName,
      userId,
      permission,
      adminId: req.adminId
    });

    const savedModule = await newModuleAllow.save();
    res.status(201).json({ message: '✅ Module permissions created', data: savedModule });
  } catch (error) {
    console.error('Error creating module permissions:', error);
    res.status(500).json({ message: '❌ Internal server error' });
  }
};

// 📖 Get module permissions
const getModuleAllow = async (req, res) => {
  try {
    const { userId } = req.query;
    const modules = await ModuleAllow.findOne({ userId });
    
    if (!modules) {
      return res.status(404).json({ message: '❌ No module permissions found' });
    }
    
    res.status(200).json({ data: modules });
  } catch (error) {
    console.error('Error fetching module permissions:', error);
    res.status(500).json({ message: '❌ Internal server error' });
  }
};

// 🔄 Update module permissions
const updateModuleAllow = async (req, res) => {
  try {
    const { userId, moduleName, permission } = req.body;
    
    const updatedModule = await ModuleAllow.findOneAndUpdate(
      { userId },
      { moduleName, permission },
      { new: true }
    );

    if (!updatedModule) {
      return res.status(404).json({ message: '❌ Module permissions not found' });
    }

    res.status(200).json({ message: '✅ Module permissions updated', data: updatedModule });
  } catch (error) {
    console.error('Error updating module permissions:', error);
    res.status(500).json({ message: '❌ Internal server error' });
  }
};

// 🗑️ Delete module permissions
const deleteModuleAllow = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const deletedModule = await ModuleAllow.findOneAndDelete({ userId });
    
    if (!deletedModule) {
      return res.status(404).json({ message: '❌ Module permissions not found' });
    }

    res.status(200).json({ message: '✅ Module permissions deleted' });
  } catch (error) {
    console.error('Error deleting module permissions:', error);
    res.status(500).json({ message: '❌ Internal server error' });
  }
};

module.exports = {
  createModuleAllow,
  getModuleAllow,
  updateModuleAllow,
  deleteModuleAllow
}; 