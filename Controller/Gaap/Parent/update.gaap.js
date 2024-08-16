const GaapUser = require('../../../Model/Gaap/gaap_user');
const bcrypt = require('bcrypt');

const updateUser = async (req, res) => {
    try {
        const { userId, ...updateData } = req.body;
        const adminId = req.adminId; 

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find the user to be updated
        const userToUpdate = await GaapUser.findById(userId);

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the requester is a admin or the creator of the user
        const requester = await GaapUser.findById(adminId);

        if (req.role !== 'admin' && (!userToUpdate.createdBy || !userToUpdate.createdBy.equals(adminId))) {
            return res.status(403).json({ 
                message: 'You do not have permission to update this user. Only admins or the user who created this account can update it.' 
            });
        }

        // Handle password update
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        // Proceed with update
        const updatedUser = await GaapUser.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.status(200).json({ message: 'User updated successfully', user: userResponse });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid update data', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while updating user' });
    }
};

module.exports = { updateUser };
