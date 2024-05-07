const Project = require('../../Model/Project');
const ProjectProgress = require('../../Model/ProjectProgress');
const Wallet = require('../../Model/Wallet');

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const adminId = req.adminId;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findOne({ _id: projectId, AdminID: adminId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized' });
    }

    const deletedProject = await Project.findByIdAndDelete(projectId);

    await ProjectProgress.deleteMany({ ProjectId: projectId });

    const projectMonth = project.StartDate.getMonth();
    const projectYear = project.StartDate.getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: adminId,
      period: {
        $gte: new Date(projectYear, projectMonth, 1),
        $lt: new Date(projectYear, projectMonth + 1, 1),
      },
    });

    if (wallet) {
      wallet.TotalOrders = (parseInt(wallet.TotalOrders) - 1).toString();
      await wallet.save();
    }

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
