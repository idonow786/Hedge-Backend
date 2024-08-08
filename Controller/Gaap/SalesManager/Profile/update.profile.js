const GaapUser = require('../../../../Model/Gaap/gaap_user');
const { uploadImageToFirebase } = require('../../../../Firebase/uploadImage');
const bcrypt = require('bcryptjs');

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.adminId;
        const { fullName, email, password, address, nationality, phoneNumber } = req.body;
        let profilePhotoUrl;

        const user = await GaapUser.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (address) user.address = address;
        if (nationality) user.nationality = nationality;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        if (req.body.profilePhoto) {
            const { base64Image, contentType } = req.body.profilePhoto;
            try {
                profilePhotoUrl = await uploadImageToFirebase(base64Image, contentType);
                user.profilePhoto = profilePhotoUrl;
            } catch (error) {
                console.error('Error uploading profile photo:', error);
            }
        }

        await user.save();

        const updatedUser = {
            fullName: user.fullName,
            email: user.email,
            profilePhoto: user.profilePhoto,
            address: user.address,
            nationality: user.nationality,
            phoneNumber: user.phoneNumber
        };

        res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update User Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user profile',
            error: error.message
        });
    }
};

module.exports = { updateUserProfile };
