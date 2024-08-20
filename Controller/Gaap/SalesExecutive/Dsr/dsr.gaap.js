const GaapDsr = require('../../../../Model/Gaap/gaap_dsr');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

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

    // Get all DSRs for a user
    getAllDsrForUser: async (req, res) => {
        try {
            const userId = req.adminId;
            const userRole = req.role;
            let query = {};
            const { startDate, endDate } = req.query;
    
            // Find the user and get their teamId
            const user = await GaapUser.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            if (userRole === 'admin' || userRole === 'General Manager') {
                // For admin and General Manager, filter by teamId
                query['user.teamId'] = user.teamId;
            } else {
                // For other roles, filter by userId
                query.user = userId;
            }
    
            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
    
            const dsrs = await GaapDsr.find(query)
                .sort({ date: -1 })
                .populate({
                    path: 'user',
                    select: 'name teamId',
                    match: { teamId: user.teamId }
                });
                console.log(dsrs)
            if (dsrs.length === 0) {
                return res.status(404).json({ message: 'No DSRs found' });
            }
    
            // Filter out any DSRs where the populated user is null (due to teamId mismatch)
            const filteredDsrs = dsrs.filter(dsr => dsr.user !== null);
    
            res.json(filteredDsrs);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching DSRs', error: error.message });
        }
    }
};

module.exports = dsrController;
