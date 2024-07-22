const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({

  name: { type: String, required: true },
  adminId: { type: String },
  tasksId: [{ type: String }],

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
