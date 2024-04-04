const Project = require('../../Model/Project');
const ProjectProgress = require('../../Model/ProjectProgress');

const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.body;
        const adminId = req.user.adminId;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const project = await Project.findOne({ _id: projectId, AdminID: adminId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found or not authorized' });
        }

        const deletedProject = await Project.findByIdAndDelete(projectId);

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

module.exports = { deleteProject };
