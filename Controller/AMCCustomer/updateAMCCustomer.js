const AMCCustomer = require('../../Model/AMCCustomer');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const updateAMCCustomer = async (req, res) => {
    try {
        const customerId = req.body.id;
        const { Name, Email, PhoneNo, Number, CompanyName, DateJoined, DateofBirth, customProperties } = req.body;
        const adminId = req.adminId;

        const customer = await AMCCustomer.findOne({ _id: customerId, AdminID: adminId });

        if (!customer) {
            return res.status(404).json({ message: 'AMC Customer not found or not authorized' });
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

        if (Name) customer.Name = Name;
        if (Email) customer.Email = Email;
        if (PhoneNo) customer.PhoneNo = PhoneNo;
        if (Number) customer.Number = Number;
        if (CompanyName) customer.CompanyName = CompanyName;
        if (DateJoined) customer.DateJoined = new Date(DateJoined);
        if (DateofBirth) customer.DateofBirth = new Date(DateofBirth);

        if (customProperties) {
            try {
                const parsedCustomProperties = typeof customProperties === 'string' 
                    ? JSON.parse(customProperties) 
                    : customProperties;

                if (!Array.isArray(parsedCustomProperties)) {
                    return res.status(400).json({ message: 'customProperties must be an array' });
                }
                
                for (const prop of parsedCustomProperties) {
                    if (!prop.propertyName || !prop.propertyType || prop.propertyValue === undefined) {
                        return res.status(400).json({ 
                            message: 'Each custom property must have propertyName, propertyType, and propertyValue' 
                        });
                    }
                    if (!['string', 'date'].includes(prop.propertyType)) {
                        return res.status(400).json({ 
                            message: 'propertyType must be either "string" or "date"' 
                        });
                    }
                }
                customer.customProperties = parsedCustomProperties;
            } catch (error) {
                return res.status(400).json({ 
                    message: 'Invalid customProperties format. Must be a valid JSON array' 
                });
            }
        }

        const updatedCustomer = await customer.save();

        res.status(200).json({
            message: 'AMC Customer updated successfully',
            customer: updatedCustomer,
        });
    } catch (error) {
        console.error('Error updating AMC customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { updateAMCCustomer }; 