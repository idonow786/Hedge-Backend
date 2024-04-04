const Staff = require('../../Model/Staff');

const deleteStaff = async (req, res) => {
  try {
    const staffId = req.body.staffId;
    const adminId = req.adminId
;

    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    const staff = await Staff.findOne({ _id: staffId, AdminID: adminId });

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found or not authorized' });
    }

    const deletedStaff = await Staff.findByIdAndDelete(staffId);

    res.status(200).json({
      message: 'Staff deleted successfully',
      staff: deletedStaff,
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { deleteStaff };
