const Customer = require('../../Model/Customer');
const Wallet = require('../../Model/Wallet');
const CustomerWallet = require('../../Model/CustomerWallet');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const { uploadFileToFirebase } = require('../../Firebase/uploadFileToFirebase');

const addCustomer = async (req, res) => {
  try {
    const { Name, Email, PhoneNo, CompanyName, DateJoined, DateofBirth } = req.body;

    if (!Name || !Email || !PhoneNo || !CompanyName) {
      return res.status(400).json({ message: 'Name, Email, PhoneNo, and CompanyName are required' });
    }

    const existingCustomer = await Customer.findOne({ Email });
    if (existingCustomer) {
      return res.status(409).json({ message: 'Customer already exists' });
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

    const newCustomer = new Customer({
      ID,
      Name,
      Email,
      PhoneNo,
      CompanyName,
      DateJoined: DateJoined ? new Date(DateJoined) : undefined,
      DateofBirth: DateofBirth ? new Date(DateofBirth) : undefined,
      PicUrl: picUrl,
      DocumentsUrls: documentUrls,
      AdminID: req.adminId
    });

    const savedCustomer = await newCustomer.save();

    const newCustomerWallet = new CustomerWallet({
      adminId: req.adminId,
      customerId: savedCustomer._id,
      yearlyBalances: [{
        year: new Date().getFullYear(),
        monthlyBalances: Array.from({length: 12}, (_, i) => ({
          month: i + 1,
          balance: 0
        }))
      }]
    });

    await newCustomerWallet.save();

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
      wallet.TotalCustomers = (parseInt(wallet.TotalCustomers) + 1).toString();
    } else {
      wallet = new Wallet({
        TotalCustomers: '1',
        AdminID: req.adminId,
        period: new Date(currentYear, currentMonth, 1),
      });
    }

    await wallet.save();

    res.status(201).json({
      message: 'Customer added successfully',
      customer: savedCustomer,
    });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addCustomer };
