const GaapDsr = require('../../../../Model/Gaap/gaap_dsr');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');

const dsrController = {
    // Add a new DSR
    addDsr: async (req, res) => {
        try {
            const { date, officeVisits, cardsCollected, meetings, proposals } = req.body;
            const user=await GaapUser.findById(req.adminId)

            const newDsr = new GaapDsr({
                user: req.adminId,
                date: new Date(date),
                officeVisits,
                cardsCollected,
                teamId:user.teamId,
                meetings,
                proposals
            });
            console.log(newDsr)
            const savedDsr = await newDsr.save();
            res.status(201).json(savedDsr);
        } catch (error) {
            res.status(400).json({ message: 'Error adding DSR', error: error.message });
        }
    },

    // Update an existing DSR
    updateDsr: async (req, res) => {
        try {
            const { drsId } = req.body;
            const { date, officeVisits, cardsCollected, meetings, proposals } = req.body;

            const updatedDsr = await GaapDsr.findByIdAndUpdate(drsId, {
                date: new Date(date),
                officeVisits,
                cardsCollected,
                meetings,
                proposals
            }, { new: true });

            if (!updatedDsr) {
                return res.status(404).json({ message: 'DSR not found' });
            }

            res.json(updatedDsr);
        } catch (error) {
            res.status(400).json({ message: 'Error updating DSR', error: error.message });
        }
    },

    // Delete a DSR
    deleteDsr: async (req, res) => {
        try {
            const { drsId } = req.body;

            const deletedDsr = await GaapDsr.findByIdAndDelete(drsId);

            if (!deletedDsr) {
                return res.status(404).json({ message: 'DSR not found' });
            }

            res.json({ message: 'DSR deleted successfully' });
        } catch (error) {
            res.status(400).json({ message: 'Error deleting DSR', error: error.message });
        }
    },

    // Get a single DSR by ID
    getDsr: async (req, res) => {
        try {
            const { drsId } = req.body;

            const dsr = await GaapDsr.findById(drsId).populate('user', 'name');

            if (!dsr) {
                return res.status(404).json({ message: 'DSR not found' });
            }

            res.json(dsr);
        } catch (error) {
            res.status(400).json({ message: 'Error fetching DSR', error: error.message });
        }
    },

    getAllDsrForUser: async (req, res) => {
        try {
            const userId = req.adminId;
            const userRole = req.role;
            let query = {};
            const { startDate, endDate } = req.query;
    
            // Find the user
            const user = await GaapUser.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            if (userRole === 'admin' || userRole === 'Operation Manager') {
                // For admin and Operation Manager, find the team first
                const team = await GaapTeam.findOne({
                    $or: [
                        { 'parentUser.userId': userId },
                        { 'GeneralUser.userId': userId }
                    ]
                });
    
                if (!team) {
                    return res.status(404).json({ message: 'Team not found for this admin/manager' });
                }
    
                // Use the team's _id to filter DSRs
                query.teamId = team._id;
            } else if (userRole === 'Sales Manager') {
                // For managers, find all members they manage
                const team = await GaapTeam.findOne({
                    'members.managerId': userId
                });
    
                if (!team) {
                    return res.status(404).json({ message: 'Team not found for this manager' });
                }
    
                const memberIds = team.members
                    .filter(member => member.managerId === userId)
                    .map(member => member.memberId);
    
                query.user = { $in: memberIds };
            } else {
                query.user = userId;
            }
    
            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
    
            // 🔍 Get DSRs without populate
            const dsrs = await GaapDsr.find(query).sort({ date: -1 });

            if (dsrs.length === 0) {
                return res.status(404).json({ message: 'No DSRs found' });
            }

            // 🧑 Get all unique user IDs from DSRs
            const userIds = [...new Set(dsrs.map(dsr => dsr.user))];
            
            // 👥 Fetch all users in one query
            const users = await GaapUser.find({ _id: { $in: userIds } }, 'fullName');
            
            // 📝 Create a map of userId to fullName
            const userMap = {};
            users.forEach(user => {
                userMap[user._id] = user.fullName;
            });

            // 🔄 Transform DSRs to include fullName at root level
            const dsrsWithNames = dsrs.map(dsr => ({
                ...dsr.toObject(),
                fullName: userMap[dsr.user]
            }));

            res.json(dsrsWithNames);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching DSRs', error: error.message });
        }
    }
    
    
};

module.exports = dsrController;
