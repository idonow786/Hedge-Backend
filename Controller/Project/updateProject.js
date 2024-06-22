const Project = require('../../Model/Project');
const Customer = require('../../Model/Customer');

const updateProject = async (req, res) => {
  try {
    const { projectId, CustomerId } = req.body;
    const adminId = req.adminId;
    const {
      Description,
      Title,
      StartDate,
      Deadline,
      Budget,
      ProgressUpdate,
      DynamicFields,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findOne({ _id: projectId, AdminID: adminId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or not authorized' });
    }

    if (CustomerId) {
      const customer = await Customer.findById(CustomerId);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      project.CustomerId = CustomerId;
    }

    project.Description = Description || project.Description;
    project.Title = Title || project.Title;
    project.StartDate = StartDate || project.StartDate;
    project.Deadline = Deadline || project.Deadline;
    project.Budget = Budget || project.Budget;
    project.ProgressUpdate = ProgressUpdate || project.ProgressUpdate;

    if (DynamicFields) {
      project.DynamicFields = DynamicFields;
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
