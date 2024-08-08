const GaapUser = require('../../../../Model/Gaap/gaap_user');

const getUserProfile = async (req, res) => {
    try {
        const userId = req.adminId;

        // Find the user by ID
        const user = await GaapUser.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prepare the user object to send in response
        const userProfile = {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            profilePhoto: user.profilePhoto,
            address: user.address,
            nationality: user.nationality,
            phoneNumber: user.phoneNumber,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            targets: user.targets
        };

        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            user: userProfile
        });

    } catch (error) {
        console.error('Get User Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user profile',
            error: error.message
        });
    }
};

module.exports = { getUserProfile };
