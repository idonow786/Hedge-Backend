const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
 ID: {
  type: Number,
  default: () => Math.floor(Math.random() * 1000000),
},
  Name: {
    type: String,
  },
  Email: {
    type: String,
  },
  PicUrl: {
    type: String,
  },
  Password: {
    type: String,
  },
  Otp: {
    type: String,
  },
  role: {
    type: String,
    default:'superadmin'
  },
  
  OtpVerified: {
    type: Boolean,
  },
  
});

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;