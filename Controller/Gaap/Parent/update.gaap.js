const GaapUser = require('../../../Model/Gaap/gaap_user');
const updateUser = async (req, res) => {
    try {
      const { userId, ...updateData } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      if (req.role !== 'Parent User') {
        return res.status(403).json({ message: 'You do not have permission to update users' });
      }
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }
  
      const updatedUser = await GaapUser.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
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

  
  module.exports={updateUser}