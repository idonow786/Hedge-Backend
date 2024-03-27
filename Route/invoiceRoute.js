const express = require('express');
const router = express.Router();
const {createInvoice} = require('../Controller/Invoice/addInvoice')
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  
router.post('/create',verifyToken,upload.single('pic'), createInvoice);                                                                 //no test

 
module.exports = router;
