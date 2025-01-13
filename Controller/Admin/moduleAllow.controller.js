const ModuleAllow = require('../../Model/ModuleAllow');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

// 📝 Create new module permission
const createModuleAllow = async (req, res) => {
  try {
    const { userId, modules } = req.body;
    
    // 🔍 Check if entry already exists
    const existingModule = await ModuleAllow.findOne({ userId });
    if (existingModule) {
      return res.status(400).json({ message: '❌ Module permissions already exist for this user' });
    }

    // 🖼️ Process images for each module if provided
    const processedModules = await Promise.all(modules.map(async (module) => {
      if (module.picBase64) {
        try {
          const picUrl = await uploadImageToFirebase(
            module.picBase64, 
            module.contentType || 'image/jpeg'
          );
          return { ...module, picUrl };
        } catch (error) {
          console.error('Error uploading image for module:', module.name, error);
          return module;
        }
      }
      return module;
    }));

    const newModuleAllow = new ModuleAllow({
      modules: processedModules,
      userId,
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
    const { userId, moduleUpdates } = req.body;
    
    const existingModuleAllow = await ModuleAllow.findOne({ userId });
    if (!existingModuleAllow) {
      return res.status(404).json({ message: '❌ Module permissions not found' });
    }

    // 🔄 Process updates for each module
    const updatedModules = await Promise.all(existingModuleAllow.modules.map(async (existingModule) => {
      const updateData = moduleUpdates.find(update => update.name === existingModule.name);
      
      if (!updateData) return existingModule;

      // 🖼️ Handle image upload if new image is provided
      let picUrl = existingModule.picUrl;
      if (updateData.picBase64) {
        try {
          picUrl = await uploadImageToFirebase(
            updateData.picBase64,
            updateData.contentType || 'image/jpeg'
          );
        } catch (error) {
          console.error('Error uploading new image for module:', existingModule.name, error);
        }
      }

      return {
        name: existingModule.name,
        link: updateData.link || existingModule.link,
        picUrl: picUrl,
        permission: updateData.permission !== undefined ? updateData.permission : existingModule.permission
      };
    }));

    // 🔄 Add any new modules
    const existingModuleNames = existingModuleAllow.modules.map(m => m.name);
    const newModules = await Promise.all(moduleUpdates
      .filter(update => !existingModuleNames.includes(update.name))
      .map(async (newModule) => {
        let picUrl = '';
        if (newModule.picBase64) {
          try {
            picUrl = await uploadImageToFirebase(
              newModule.picBase64,
              newModule.contentType || 'image/jpeg'
            );
          } catch (error) {
            console.error('Error uploading image for new module:', newModule.name, error);
          }
        }

        return {
          name: newModule.name,
          link: newModule.link || '',
          picUrl: picUrl,
          permission: newModule.permission || false
        };
      }));

    const updatedModuleAllow = await ModuleAllow.findOneAndUpdate(
      { userId },
      { modules: [...updatedModules, ...newModules] },
      { new: true }
    );

    res.status(200).json({ message: '✅ Module permissions updated', data: updatedModuleAllow });
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