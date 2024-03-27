const Business = require('../../Model/Business');

const deleteBusiness = async (req, res) => {
  try {
    const { BusinessId } = req.body;

    if (!BusinessId) {
      return res.status(400).json({ message: 'BusinessId is required' });
    }

    const deletedBusiness = await Business.findByIdAndDelete( BusinessId );

    if (!deletedBusiness) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(200).json({
      message: 'Business deleted successfully',
      Business: deletedBusiness,
    });
  } catch (error) {
    console.error('Error deleting Business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports={deleteBusiness}