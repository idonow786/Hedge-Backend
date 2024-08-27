const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');

const getUsersCreatedByAdmin = async (req, res) => {
    try {
        const adminId = req.adminId; 

        if (!adminId) {
            return res.status(400).json({ message: 'Admin ID is required' });
        }

        // Find the admin user
        const adminUser = await GaapUser.findById(adminId);
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Find the team where the admin is involved
        const team = await GaapTeam.findOne({ 
            $or: [
                { 'parentUser.userId': adminId },
                { 'GeneralUser.userId': adminId },
                { 'members.managerId': adminId }
            ]
        });
        
        if (!team) {
            return res.status(404).json({ message: 'No team found for this admin' });
        }

        let memberIds;

        if (team.parentUser.userId === adminId || team.GeneralUser.userId === adminId) {
            // If admin is parentUser or GeneralUser, get all member IDs
            memberIds = team.members.map(member => member.memberId);
        } else {
            // If admin is a manager, get only the members they manage
            memberIds = team.members
                .filter(member => member.managerId === adminId)
                .map(member => member.memberId);
        }

        // Find all users who are members of this team
        const users = await GaapUser.find({ 
            _id: { $in: memberIds }
        }).select('-password');

        if (!users.length) {
            return res.status(404).json({ message: 'No users found for this admin.' });
        }

        // Prepare the response data
        const responseData = {
            admin: {
                _id: adminUser._id,
                username: adminUser.username,
                fullName: adminUser.fullName,
                email: adminUser.email,
                role: adminUser.role,
                department: adminUser.department
            },
            team: {
                _id: team._id,
                teamName: team.teamName,
                BusinessId: team.BusinessId
            },
            users: users
        };

        res.status(200).json({ message: 'Users fetched successfully', data: responseData });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

module.exports = { getUsersCreatedByAdmin };