const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const { uploadFileToFirebase } = require('../../../../Firebase/uploadFileToFirebase');
const admin = require('../../../../Firebase/config');

const bucket = admin.storage().bucket();

const updateCustomer = async (req, res) => {
  try {
    const customerId = req.body.customerId;
    const updateData = req.body;
    const files = req.files;

    const customer = await GaapCustomer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fields that need to be parsed as JSON
    const jsonFields = ['address', 'contactPerson1', 'contactPerson2'];

    Object.keys(updateData).forEach(field => {
      if (field !== 'customerId' && field !== 'documents') {
        if (jsonFields.includes(field)) {
          try {
            customer[field] = JSON.parse(updateData[field]);
          } catch (error) {
            throw new Error(`Invalid JSON for field: ${field}`);
          }
        } else {
          customer[field] = updateData[field];
        }
      }
    });

    if (files) {
      for (const fieldName in files) {
        const file = files[fieldName][0];
        const fileUrl = await uploadFileToFirebase(file.buffer, file.originalname);

        if (fieldName.startsWith('document_')) {
          const index = parseInt(fieldName.split('_')[1]);
          if (customer.documents[index]) {
            if (customer.documents[index].documentUrl) {
              const oldFileName = customer.documents[index].documentUrl.split('/').pop().split('?')[0];
              await bucket.file(`documents/${oldFileName}`).delete().catch(console.error);
            }
            customer.documents[index].documentUrl = fileUrl;
          }
        } else {
          customer.documents.push({
            documentType: fieldName,
            documentUrl: fileUrl
          });
        }
      }
    }

    const updatedCustomer = await customer.save();

    res.status(200).json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Error in updateCustomer:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    if (error.message.startsWith('Invalid JSON for field:')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'An error occurred while updating the customer' });
  }
};

module.exports = { updateCustomer };
