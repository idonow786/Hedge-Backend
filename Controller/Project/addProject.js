const Project = require('../../Model/Project');
const ProjectProgress = require('../../Model/ProjectProgress');

const addProject = async (req, res) => {
    try {
        const {
            Title,
            AboutProject,
            Activity,
            TeamMembers,
            TotalTask,
            CompletedTask,
            HoursSpend,
            SpendingAmount,
            ProgressPercentage,
        } = req.body;
        const adminId = req.user.adminId;

        if (!AboutProject || !TeamMembers || !TotalTask) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const ID = Math.floor(Math.random() * 1000000);

        const newProject = new Project({
            ID,
            Title,
            TotalTask,
            CompletedTask,
            HoursSpend,
            SpendingAmount,
            ProgressPercentage,
            Activity,
            AboutProject,
            TeamMembers: [],
            AdminID: adminId,
        });

        const projectProgressRecords = [];
        for (const member of TeamMembers) {
            const projectProgress = new ProjectProgress({
                StaffId: member.StaffId,
                StaffName: member.StaffName,
                ProjectId: newProject._id,
                Status: 'In Progress',
                Time: 0,
                Modules: [],
            });

            projectProgressRecords.push(projectProgress);
            newProject.TeamMembers.push({
                StaffId: member.StaffId,
                ProjectProgressId: projectProgress._id,
            });
        }

        const savedProject = await newProject.save();
        await ProjectProgress.insertMany(projectProgressRecords);

        res.status(201).json({
            message: 'Project added successfully',
            project: savedProject,
        });
    } catch (error) {
        console.error('Error adding project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { addProject };
