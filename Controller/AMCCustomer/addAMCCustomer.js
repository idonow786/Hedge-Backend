const AMCCustomer = require('../../Model/AMCCustomer');
const Wallet = require('../../Model/Wallet');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const addAMCCustomer = async (req, res) => {
  try {
    const { Name, Email, PhoneNo, CompanyName, DateJoined, DateofBirth, customProperties } = req.body;
    console.log(req.body)
    if (!Name || !Email || !PhoneNo || !CompanyName) {
      return res.status(400).json({ message: 'Name, Email, PhoneNo, and CompanyName are required' });
    }

    const existingCustomer = await AMCCustomer.findOne({ Email });
    if (existingCustomer) {
      return res.status(409).json({ message: 'AMC Customer already exists' });
    }

    const ID = Math.floor(Math.random() * 1000000);

    let picUrl = '';
    if (req.files && req.files.profilePic) {
      const base64Image = req.files.profilePic[0].buffer.toString('base64');
      const contentType = req.files.profilePic[0].mimetype;

      try {
        picUrl = await uploadImageToFirebase(base64Image, contentType);
      } catch (error) {
        console.error('Error uploading image to Firebase:', error);
      }
    }

    let documentUrls = [];
    if (req.files && req.files.documents) {
      for (const file of req.files.documents) {
        try {
          const fileUrl = await uploadFileToFirebase(file.buffer, file.originalname);
          documentUrls.push(fileUrl);
        } catch (error) {
          console.error('Error uploading file to Firebase:', error);
        }
      }
    }

    // Parse customProperties if it's a string
    let parsedCustomProperties;
    if (customProperties) {
      try {
        parsedCustomProperties = typeof customProperties === 'string' 
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
      } catch (error) {
        return res.status(400).json({ 
          message: 'Invalid customProperties format. Must be a valid JSON array' 
        });
      }
    }

    const newAMCCustomer = new AMCCustomer({
      ID,
      Name,
      Email,
      PhoneNo,
      CompanyName,
      DateJoined: DateJoined ? new Date(DateJoined) : undefined,
      DateofBirth: DateofBirth ? new Date(DateofBirth) : undefined,
      PicUrl: picUrl,
      DocumentsUrls: documentUrls,
      AdminID: req.adminId,
      customProperties: parsedCustomProperties || []
    });

    const savedCustomer = await newAMCCustomer.save();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let wallet = await Wallet.findOne({
      AdminID: req.adminId,
      period: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1),
      },
    });

    if (wallet) {
      wallet.TotalAMCCustomers = (parseInt(wallet.TotalAMCCustomers || 0) + 1).toString();
    } else {
      wallet = new Wallet({
        TotalAMCCustomers: '1',
        AdminID: req.adminId,
        period: new Date(currentYear, currentMonth, 1),
      });
    }

    await wallet.save();

    res.status(201).json({
      message: 'AMC Customer added successfully',
      customer: savedCustomer,
    });
  } catch (error) {
    console.error('Error adding AMC customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addAMCCustomer }; 