const express = require('express');
const router = express.Router();
const {addStaff} = require('../Controller/Staff/addStaff')
const {deletestaff} = require('../Controller/Staff/deleteStaff')
const {updatestaff} = require('../Controller/Staff/updateStaff')
const {getstaffs} = require('../Controller/Staff/getStaff')
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  

router.post('/staff', verifyToken, upload.single('profilePic'), addStaff);                               //no test
router.put('/staff/update', verifyToken, upload.single('profilePic'), updatestaff);                      //no test
router.delete('/staff/remove', verifyToken, deletestaff);                                                //no test
router.get('/staff', verifyToken, getstaffs);                                                            //no test
 
module.exports = router;

