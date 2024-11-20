const express = require('express');
const router = express.Router();
const { addAMCCustomer } = require('../Controller/AMCCustomer/addAMCCustomer');
const { deleteAMCCustomer } = require('../Controller/AMCCustomer/deleteAMCCustomer');
const { updateAMCCustomer } = require('../Controller/AMCCustomer/updateAMCCustomer');
const { getAMCCustomers } = require('../Controller/AMCCustomer/getAMCCustomer');
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// Add AMC Customer - with profile pic and documents upload
router.post('/add', 
  verifyToken, 
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]), 
  addAMCCustomer
);

// Update AMC Customer - with profile pic and documents upload
router.put('/update', 
  verifyToken, 
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]), 
  updateAMCCustomer
);

// Delete AMC Customer
router.delete('/remove', verifyToken, deleteAMCCustomer);

// Get AMC Customers
router.get('/get', verifyToken, getAMCCustomers);

module.exports = router; 