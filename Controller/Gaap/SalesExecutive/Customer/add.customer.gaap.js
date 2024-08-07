const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const { uploadFileToFirebase } = require('../../../../Firebase/uploadFileToFirebase');

const registerCustomer = async (req, res) => {
  try {
    let {
      companyName,
      landline,
      mobile,
      address,
      contactPerson1,
      contactPerson2,
      trNumber,
      industryType
    } = req.body;

    if (!companyName || !trNumber || !mobile || !industryType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse the string inputs into objects
    try {
      address = JSON.parse(address);
      contactPerson1 = JSON.parse(contactPerson1);
      contactPerson2 = JSON.parse(contactPerson2);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(400).json({ message: 'Invalid JSON in address, contactPerson1, or contactPerson2' });
    }

    const documents = [];
    if (req.files) {
      for (const fieldName in req.files) {
        for (const file of req.files[fieldName]) {
          try {
            const fileUrl = await uploadFileToFirebase(file.buffer, file.originalname);
            documents.push({
              documentType: fieldName,
              documentUrl: fileUrl
            });
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
          }
        }
      }
    }
    
    const newCustomer = new GaapCustomer({
      companyName,
      landline,
      mobile,
      address,
      contactPerson1,
      contactPerson2,
      trNumber,
      documents,
      industryType,
      registeredBy: req.adminId 
    });

    const savedCustomer = await newCustomer.save();

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: savedCustomer
    });

  } catch (error) {
    console.error('Error in registerCustomer:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'A customer with this TR number already exists' });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors: validationErrors });
    }

    res.status(500).json({ message: 'An error occurred while registering the customer' });
  }
};


module.exports = { registerCustomer };
