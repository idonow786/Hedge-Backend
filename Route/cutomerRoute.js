const express = require('express');
const router = express.Router();
const {addCustomer} = require('../Controller/Customer/addCustomer')
const {deleteCustomer} = require('../Controller/Customer/deleteCustomer')
const {updateCustomer} = require('../Controller/Customer/updateCustomer')
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  

router.post('/customer', verifyToken, upload.single('profilePic'), addCustomer);                               //no test
router.put('/customer/update', verifyToken, upload.single('profilePic'), updateCustomer);                      //no test
router.delete('/customer/remove', verifyToken, deleteCustomer);                                                //no test
 
module.exports = router;

