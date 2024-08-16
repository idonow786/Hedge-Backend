const GaapUser = require('../../../Model/Gaap/gaap_user');

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const adminId = req.adminId; 

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find the user to be deleted
        const userToDelete = await GaapUser.findById(userId);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(req.role)
        if (req.role !== 'Parent User' ) {
            return res.status(403).json({ 
                message: 'You do not have permission to delete this user. Only Parent Users or the user who created this account can delete it.' 
            });
        }
    
        // Proceed with deletion
        const deletedUser = await GaapUser.findByIdAndDelete(userId);

        res.status(200).json({ 
            message: 'User deleted successfully', 
            deletedUser: {
                _id: deletedUser._id,
                username: deletedUser.username,
                email: deletedUser.email,
                fullName: deletedUser.fullName,
                role: deletedUser.role
            }
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};

module.exports = { deleteUser };
