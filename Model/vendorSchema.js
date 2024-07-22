const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: String,
  contactInformation: {
    email: String,
    phone: String,
    address: String,
    companyname:String,
  },
  password:{
    type:String
  }
});

module.exports = mongoose.model('Vendor', vendorSchema);
