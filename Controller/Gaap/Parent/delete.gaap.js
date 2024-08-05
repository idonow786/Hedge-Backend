const GaapUser = require('../../../Model/Gaap/gaap_user');
const deleteUser = async (req, res) => {
    try {
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      if (req.role !== 'Parent User') {
        return res.status(403).json({ message: 'You do not have permission to delete users' });
      }
  
      const deletedUser = await GaapUser.findByIdAndDelete(userId);
  
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error while deleting user' });
    }
  };


  module.exports={deleteUser}