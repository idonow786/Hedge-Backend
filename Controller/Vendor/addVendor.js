const Vendor = require('../../Model/vendorSchema'); 
const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  return password;
}

const transporter = nodemailer.createTransport(
  new sendinBlue({
    apiKey: process.env.SENDINBLUE_API_KEY,
  })
);

const addVendor = async (req, res) => {
  try {
    const { name, email, phoneNo, address, companyName } = req.body;

    const password = generateRandomPassword();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = new Vendor({
      adminId:req.adminId,
      name,
      role: 'Vendor', 
      contactInformation: {
        email,
        phone: phoneNo,
        address,
        companyname: companyName,
      },
      password: hashedPassword,
    });

    await newVendor.save();

    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: email,
      subject: 'Your Vendor Account Details',
      html: `
        <div>
          <h2>Welcome to Our Platform!</h2>
          <p>Your vendor account has been created successfully.</p>
          <p>Here are your login details:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:strong> ${password}</p>
          <p>Please change your password after your first login.</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Vendor created but failed to send email' });
      } else {
        console.log('Email sent:', info.response);
        res.status(201).json({ message: 'Vendor created and email sent successfully' });
      }
    });

  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVendors = async (req, res) => {
  try {
    const adminId = req.adminId; 

    const vendors = await Vendor.find({ adminId: adminId });

    if (!vendors || vendors.length === 0) {
      return res.status(404).json({ message: 'No vendors found for this admin' });
    }

    const vendorsData = vendors.map(vendor => ({
      id: vendor._id,
      name: vendor.name,
      role: vendor.role,
      contactInformation: vendor.contactInformation
    }));

    res.status(200).json(vendorsData);

  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const updateVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;
    const { name, email, phoneNo, address, companyName, password } = req.body;
    const adminId = req.adminId;

    const vendor = await Vendor.findOne({ _id: vendorId, adminId: adminId });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found or you do not have permission to update this vendor' });
    }

    vendor.name = name || vendor.name;
    vendor.contactInformation.email = email || vendor.contactInformation.email;
    vendor.contactInformation.phone = phoneNo || vendor.contactInformation.phone;
    vendor.contactInformation.address = address || vendor.contactInformation.address;
    vendor.contactInformation.companyname = companyName || vendor.contactInformation.companyname;

    let passwordChanged = false;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      vendor.password = hashedPassword;
      passwordChanged = true;
    }

    await vendor.save();

    if (passwordChanged) {
      const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: vendor.contactInformation.email,
        subject: 'Your Vendor Account Password Has Been Updated',
        html: `
          <div>
            <h2>Password Update Notification</h2>
            <p>Your vendor account password has been updated.   ${password}</p>
            <p>If you did not request this change, please contact support immediately.</p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    const updatedVendorData = {
      id: vendor._id,
      name: vendor.name,
      role: vendor.role,
      contactInformation: vendor.contactInformation
    };

    res.status(200).json({ 
      message: 'Vendor updated successfully', 
      vendor: updatedVendorData,
      passwordChanged: passwordChanged
    });

  } catch (error) {
    console.error('Error updating vendor:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};


const deleteVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;
    const adminId = req.adminId; 

    const vendor = await Vendor.findOne({ _id: vendorId, adminId: adminId });

    if (!vendor) {
      return res.status(404).json({ 
        message: 'Vendor not found or you do not have permission to delete this vendor' 
      });
    }

    await Vendor.deleteOne({ _id: vendorId });

    res.status(200).json({ message: 'Vendor deleted successfully' });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addVendor, getVendors, updateVendor, deleteVendor };
