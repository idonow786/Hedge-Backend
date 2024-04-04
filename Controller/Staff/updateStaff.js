const Staff = require('../../Model/Staff');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const updateStaff = async (req, res) => {
    try {
        const staffId = req.body.id;
        const adminId = req.user.adminId;
        const { StaffName, Email, PhoneNo, DateJoined, DateofBirth, Gender, Description } = req.body;

        if (!staffId) {
            return res.status(400).json({ message: 'Staff ID is required' });
        }

        const staff = await Staff.findOne({ _id: staffId, AdminID: adminId });

        if (!staff) {
            return res.status(404).json({ message: 'Staff not found or not authorized' });
        }

        let picUrl = staff.PicUrl;
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const contentType = req.file.mimetype;

            try {
                const imageUrl = await uploadImageToFirebase(base64Image, contentType);
                picUrl = imageUrl;
            } catch (error) {
                console.error('Error uploading image to Firebase:', error);
            }
        }

        staff.StaffName = StaffName || staff.StaffName;
        staff.Email = Email || staff.Email;
        staff.PhoneNo = PhoneNo || staff.PhoneNo;
        staff.Date = DateJoined ? new Date(DateJoined) : staff.Date;
        staff.DateofBirth = DateofBirth ? new Date(DateofBirth) : staff.DateofBirth;
        staff.PicUrl = picUrl;
        staff.Gender = Gender || staff.Gender;
        staff.Description = Description || staff.Description;

        const updatedStaff = await staff.save();

        res.status(200).json({
            message: 'Staff updated successfully',
            staff: updatedStaff,
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { updateStaff };
