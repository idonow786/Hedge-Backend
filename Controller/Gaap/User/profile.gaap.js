
const GaapUser = require('../../../Model/Gaap/gaap_user');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.adminId

    const user = await GaapUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User profile retrieved successfully',
      user: user.toObject({ virtuals: true })
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
};




module.exports={getUserProfile}