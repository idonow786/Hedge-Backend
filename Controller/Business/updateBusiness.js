const Business = require('../../Model/Business');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const updateBusiness = async (req, res) => {
  try {
    const {
      BusinessName,
      BusinessAddress,
      BusinessPhoneNo,
      BusinessEmail,
      CompanyType,
      CompanyActivity,
      OwnerName,
      NumberofEmployees,
      YearofEstablishment,
      BusinessType,
      Services,
      Products,
      ServiceandProduct,
    } = req.body;

    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const business = await Business.findOne({ AdminID: adminId });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Handle logo upload if file is present
    if (req.file) {
      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const contentType = req.file.mimetype;

        // Upload to Firebase
        const logoUrl = await uploadImageToFirebase(base64Image, contentType);
        business.LogoURL = logoUrl;
      } catch (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return res.status(500).json({ message: 'Error uploading logo' });
      }
    }

    // Update other fields
    business.BusinessName = BusinessName || business.BusinessName;
    business.BusinessAddress = BusinessAddress || business.BusinessAddress;
    business.BusinessPhoneNo = BusinessPhoneNo || business.BusinessPhoneNo;
    business.BusinessEmail = BusinessEmail || business.BusinessEmail;
    business.CompanyType = CompanyType || business.CompanyType;
    business.CompanyActivity = CompanyActivity || business.CompanyActivity;
    business.OwnerName = OwnerName || business.OwnerName;
    business.NumberofEmployees = NumberofEmployees || business.NumberofEmployees;
    business.YearofEstablishment = YearofEstablishment || business.YearofEstablishment;
    business.BusinessType = BusinessType || business.BusinessType;

    // Update business type specific fields
    if (BusinessType === 'Services') {
      business.Services = Services || business.Services;
      // Clear other fields
      business.Products = [];
      business.ServiceandProduct = [];
    } else if (BusinessType === 'Product') {
      business.Products = Products || business.Products;
      // Clear other fields
      business.Services = [];
      business.ServiceandProduct = [];
    } else if (BusinessType === 'ServicesNProducts') {
      business.ServiceandProduct = ServiceandProduct || business.ServiceandProduct;
      // Clear other fields
      business.Services = [];
      business.Products = [];
    }

    const updatedBusiness = await business.save();

    res.status(200).json({
      message: 'Business updated successfully',
      Business: updatedBusiness,
    });
  } catch (error) {
    console.error('Error updating Business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateBusiness };
