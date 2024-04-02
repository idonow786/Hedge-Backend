const express = require('express');
const router = express.Router();
const {addCustomer} = require('../Controller/Customer/addCustomer')
const {deleteCustomer} = require('../Controller/Customer/deleteCustomer')
const {updateCustomer} = require('../Controller/Customer/updateCustomer')
const {getCustomers} = require('../Controller/Customer/getCustomer')
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  

router.post('/add', verifyToken, upload.single('profilePic'), addCustomer);                           //WORKING
router.put('/update', verifyToken, upload.single('profilePic'), updateCustomer);                      //Working
router.delete('/remove', verifyToken, deleteCustomer);                                                //working
router.get('/get', verifyToken, getCustomers);                                                        //working
 
module.exports = router;

