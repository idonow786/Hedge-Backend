const GaapUser = require('../../../Model/Gaap/gaap_user');
const GaapBranch = require('../../../Model/Gaap/gaap_branch');

// Function to fetch GaapUsers
const fetchGaapUsers = async (req, res) => {
    try {
        const adminId = req.adminId;
        const { branchId } = req.body; // Get branchId from request body

        const requester = await GaapUser.find({createdBy:adminId});

        if (!requester) {
            return res.status(404).json({ message: 'Requester not found' });
        }

        let users;
        let branches;

        // Get all branches first
        branches = await GaapBranch.find({ adminId });
        const branchMap = {};
        branches.forEach(branch => {
            branchMap[branch._id.toString()] = {
                branchName: branch.branchName,
                location: branch.location
            };
        });

        // Build query based on role and branchId
        let query = {};
        if (requester.role !== 'admin') {
            query.createdBy = adminId;
        }
        if (branchId) {
            query.branchId = branchId;
        }

        // Fetch users with the constructed query
        users = await GaapUser.find(query).select('-password');

        // Manually add branch information
        const usersWithBranch = users.map(user => {
            const userObj = user.toObject();
            const branchInfo = userObj.branchId ? branchMap[userObj.branchId] : null;
            
            return {
                ...userObj,
                branchName: branchInfo ? branchInfo.branchName : null,
                branchLocation: branchInfo ? branchInfo.location : null
            };
        });

        res.status(200).json({
            message: 'Users fetched successfully',
            users: usersWithBranch
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

module.exports = { fetchGaapUsers };