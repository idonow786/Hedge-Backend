const ProjectC = require('../../Model/projectConstruction');

const deleteProjectConstruction = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const deletedProject = await ProjectC.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted successfully', deletedProject });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { deleteProjectConstruction };
