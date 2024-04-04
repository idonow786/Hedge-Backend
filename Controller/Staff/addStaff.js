const Staff = require('../../Model/Staff');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const addStaff = async (req, res) => {
  try {
    const {
      StaffName,
      Email,
      PhoneNo,
      BackupPhoneNo,
      DateJoined,
      Gender,
      DateofBirth,
      Description,
      HomeAddress,
      PermanentAddress,
      ReferenceName,
      ReferenceContact,
      NationalIDNo,
      PassportDetails,
      DateOfJoining,
      ContractType,
      JobTitle,
      SalaryPackage,
    } = req.body;
    const adminId = req.adminId;

    const ID = Math.floor(Math.random() * 1000000);

    let picUrl = '';
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

    const newStaff = new Staff({
      ID,
      StaffName,
      Email,
      PhoneNo,
      BackupPhoneNo,
      Date: DateJoined ? new Date(DateJoined) : undefined,
      PicUrl: picUrl,
      Gender,
      DateofBirth: DateofBirth ? new Date(DateofBirth) : undefined,
      Description,
      AdminID: adminId,
      HomeAddress,
      PermanentAddress,
      ReferenceName,
      ReferenceContact,
      NationalIDNo,
      PassportDetails,
      DateOfJoining: DateOfJoining ? new Date(DateOfJoining) : undefined,
      ContractType,
      JobTitle,
      SalaryPackage,
    });

    const savedStaff = await newStaff.save();

    res.status(201).json({
      message: 'Staff added successfully',
      staff: savedStaff,
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Staff with the same ID already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addStaff };