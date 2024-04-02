const Staff = require('../../Model/Staff');

const deletestaff = async (req, res) => {
  try {
    const staffId = req.body.staffid;

    const deletedstaff = await Staff.findByIdAndDelete(staffId);

    if (!deletedstaff) {
      return res.status(404).json({ message: 'staff not found' });
    }

    res.status(200).json({
      message: 'staff deleted successfully',
      staff: deletedstaff,
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports={deletestaff}