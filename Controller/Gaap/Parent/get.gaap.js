const GaapUser = require('../../../Model/Gaap/gaap_user');

// Function to fetch GaapUsers
const fetchGaapUsers = async (req, res) => {
    try {
        const adminId = req.adminId;

        const requester = await GaapUser.find({createdBy:adminId});

        if (!requester) {
            return res.status(404).json({ message: 'Requester not found' });
        }

        let users;

        if (requester.role === 'admin') {
            // Get users with branch information
            users = await GaapUser.find({})
                .select('-password')
                .populate('branchId', 'branchName location');
        } else {
            // Get users with branch information for specific admin
            users = await GaapUser.find({ createdBy: adminId })
                .select('-password')
                .populate('branchId', 'branchName location');
        }

        // Maintain backward compatibility while adding branch info
        const usersWithBranch = users.map(user => {
            const userObj = user.toObject();
            return {
                ...userObj,
                branchName: userObj.branchId ? userObj.branchId.branchName : null,
                branchLocation: userObj.branchId ? userObj.branchId.location : null,
                branchId: userObj.branchId ? userObj.branchId._id : null
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