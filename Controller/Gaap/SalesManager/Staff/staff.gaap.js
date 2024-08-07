const GaapUser = require('../../../../Model/Gaap/gaap_user');

const getUsersCreatedByAdmin = async (req, res) => {
    try {
        const adminId = req.adminId; 

        if (!adminId) {
            return res.status(400).json({ message: 'Admin ID is required' });
        }

        const users = await GaapUser.find({ createdBy: adminId }).select('-password'); 

        if (!users.length) {
            return res.status(404).json({ message: 'No users found created by this admin.' });
        }

        res.status(200).json({ message: 'Users fetched successfully', users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

module.exports = { getUsersCreatedByAdmin };
