const express = require('express');
const router = express.Router();
const { addCustomer } = require('../Controller/Customer/addCustomer')
const { deleteCustomer } = require('../Controller/Customer/deleteCustomer')
const { updateCustomer } = require('../Controller/Customer/updateCustomer')
const { getCustomers,getCustomerWalletData,getCustomerProjects } = require('../Controller/Customer/getCustomer')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.post('/add', verifyToken, upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'documents', maxCount: 5 }]), addCustomer);                                                 //WORKING
router.put('/update', verifyToken, upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'documents', maxCount: 5 }]), updateCustomer);                      //Working
router.delete('/remove', verifyToken, deleteCustomer);                                                //working
router.get('/get', verifyToken, getCustomers);                                                        //working
router.post('/get-specific', verifyToken, getCustomerWalletData);                                                        //working
router.post('/get-projects', verifyToken, getCustomerProjects);                                                        //working


module.exports = router;

