
const ProjectC = require('../../Model/projectConstruction');


const getConstructionProjects = async (req, res) => {
  try {
    const adminId = req.adminId; 

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }
    console.log(adminId)
    console.log(await ProjectC.find())
    const projects = await ProjectC.find({ adminId })
      .populate('projectTeam.projectManager', 'name email')
      .populate('projectTeam.teamMembers', 'name email')
      .populate('projectTeam.subcontractors', 'name contactInfo') 
      .populate('tasks') 
      .populate('risks.owner', 'name email'); 

    if (!projects || projects.length === 0) {
      return res.status(404).json({ message: 'No construction projects found for this admin' });
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching construction projects:', error);
    res.status(500).json({ message: 'Error fetching construction projects', error: error.message });
  }
};

module.exports={getConstructionProjects}