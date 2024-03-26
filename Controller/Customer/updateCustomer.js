const Customer = require('../../Model/Customer');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const updateCustomer = async (req, res) => {
    try {
        const customerId = req.body.id;
        const { Name, Email, PhoneNo, DateJoined, DateofBirth } = req.body;

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        let picUrl = ''
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const contentType = req.file.mimetype;

            const imageUrl = await uploadImageToFirebase(base64Image, contentType);
            picUrl = imageUrl;
        }
        customer.Name = Name || customer.Name;
        customer.Email = Email || customer.Email;
        customer.PhoneNo = PhoneNo || customer.PhoneNo;
        customer.DateJoined = DateJoined || customer.DateJoined;
        customer.DateofBirth = DateofBirth || customer.DateofBirth;
        customer.PicUrl = picUrl;


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

module.exports={updateCustomer}
