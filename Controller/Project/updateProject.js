const Project = require('../../Model/Project');
const ProjectProgress = require('../../Model/ProjectProgress');

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const adminId = req.adminId
;
    const {
      AboutProject,
      Activity,
      TeamMembers,
      TotalTask,
      CompletedTask,
      HoursSpend,
      SpendingAmount,
      ProgressPercentage,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findOne({ _id: projectId, AdminID: adminId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized' });
    }

    project.AboutProject = AboutProject || project.AboutProject;
    project.Activity = Activity || project.Activity;
    project.TotalTask = TotalTask || project.TotalTask;
    project.CompletedTask = CompletedTask || project.CompletedTask;
    project.HoursSpend = HoursSpend || project.HoursSpend;
    project.SpendingAmount = SpendingAmount || project.SpendingAmount;
    project.ProgressPercentage = ProgressPercentage || project.ProgressPercentage;

    if (TeamMembers) {
      await ProjectProgress.deleteMany({ ProjectId: project._id });
      project.TeamMembers = [];

      const projectProgressRecords = [];
      for (const member of TeamMembers) {
        const projectProgress = new ProjectProgress({
          StaffId: member.StaffId,
          StaffName: member.StaffName,
          ProjectId: project._id,
          Status: 'In Progress',
          Time: 0,
          Modules: [],
        });

        projectProgressRecords.push(projectProgress);
        project.TeamMembers.push({
          StaffId: member.StaffId,
          ProjectProgressId: projectProgress._id,
        });
      }

      await ProjectProgress.insertMany(projectProgressRecords);
    }

    const updatedProject = await project.save();

    res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateProject };
