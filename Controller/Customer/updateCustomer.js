const Customer = require('../../Model/Customer');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const updateCustomer = async (req, res) => {
    try {
        const customerId = req.body.id;
        const { 
            Name, 
            Email, 
            PhoneNo, 
            Number, 
            CompanyName, 
            DateJoined, 
            DateofBirth,
            customProperties,
            removeDocuments
        } = req.body;
        const adminId = req.adminId;

        const customer = await Customer.findOne({ _id: customerId, AdminID: adminId });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found or not authorized' });
        }

        if (req.files && req.files.profilePic) {
            const base64Image = req.files.profilePic[0].buffer.toString('base64');
            const contentType = req.files.profilePic[0].mimetype;

            try {
                const imageUrl = await uploadImageToFirebase(base64Image, contentType);
                customer.PicUrl = imageUrl;
            } catch (error) {
                console.error('Error uploading image to Firebase:', error);
            }
        }

        if (req.files && req.files.documents) {
            for (const file of req.files.documents) {
                try {
                    const fileUrl = await uploadFileToFirebase(file.buffer, file.originalname);
                    customer.DocumentsUrls.push(fileUrl);
                } catch (error) {
                    console.error('Error uploading file to Firebase:', error);
                }
            }
        }

        if (removeDocuments && Array.isArray(removeDocuments)) {
            customer.DocumentsUrls = customer.DocumentsUrls.filter(
                url => !removeDocuments.includes(url)
            );
        }

        if (customProperties && Array.isArray(customProperties)) {
            const validatedCustomProperties = customProperties
                .map(prop => ({
                    propertyName: prop.propertyName,
                    propertyType: prop.propertyType,
                    value: prop.value
                }))
                .filter(prop => prop.propertyName && prop.propertyType);

            customer.customProperties = validatedCustomProperties;
        }

        if (Name) customer.Name = Name;
        if (Email) customer.Email = Email;
        if (PhoneNo) customer.PhoneNo = PhoneNo;
        if (Number) customer.Number = Number;
        if (CompanyName) customer.CompanyName = CompanyName;
        if (DateJoined) customer.DateJoined = new Date(DateJoined);
        if (DateofBirth) customer.DateofBirth = new Date(DateofBirth);

        const updatedCustomer = await customer.save();

        res.status(200).json({
            message: 'Customer updated successfully',
            customer: updatedCustomer,
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { updateCustomer };
