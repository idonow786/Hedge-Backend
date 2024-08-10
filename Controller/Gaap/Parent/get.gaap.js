
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

        if (requester.role === 'Parent User') {
            users = await GaapUser.find({}).select('-password');
        } else {
            users = await GaapUser.find({ createdBy: adminId }).select('-password');
        }

        res.status(200).json({
            message: 'Users fetched successfully',
            users: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

module.exports = { fetchGaapUsers };