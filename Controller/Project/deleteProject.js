const Project = require('../../Model/Project');
const ProjectProgress = require('../../Model/ProjectProgress');
const deleteProject = async (req, res) => {
    try {
      const { projectId } = req.body;
  
      const deletedProject = await Project.findByIdAndDelete(projectId);
  
      if (!deletedProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      await ProjectProgress.deleteMany({ ProjectId: projectId });
  
      res.status(200).json({
        message: 'Project deleted successfully',
        project: deletedProject,
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  module.exports={deleteProject}