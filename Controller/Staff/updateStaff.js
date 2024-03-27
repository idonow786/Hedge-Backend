const Staff = require('../../Model/Staff');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const updatestaff = async (req, res) => {
    try {
        const staffId = req.body.id;
        const { Name, Email, PhoneNo, DateJoined, DateofBirth } = req.body;

        const staff = await Staff.findById(staffId);

        if (!staff) {
            return res.status(404).json({ message: 'staff not found' });
        }
        let picUrl = ''
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const contentType = req.file.mimetype;

            const imageUrl = await uploadImageToFirebase(base64Image, contentType);
            picUrl = imageUrl;
        }
        staff.Name = Name || staff.Name;
        staff.Email = Email || staff.Email;
        staff.PhoneNo = PhoneNo || staff.PhoneNo;
        staff.DateJoined = DateJoined || staff.DateJoined;
        staff.DateofBirth = DateofBirth || staff.DateofBirth;
        staff.PicUrl = picUrl;


        const updatedstaff = await staff.save();

        res.status(200).json({
            message: 'staff updated successfully',
            staff: updatedstaff,
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports={updatestaff}
