const ProjectC = require('../../Model/projectConstruction')

const updateProjectStatus = async (req, res) => {
  try {
    const { projectId, status } = req.body;

    if (!projectId || !status) {
      return res.status(400).json({ message: 'Project ID and status are required' });
    }

    const updatedProject = await ProjectC.findByIdAndUpdate(
      projectId,
      { Status: status },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({
      message: 'Project status updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ message: 'Error updating project status', error: error.message });
  }
};

module.exports = { updateProjectStatus };