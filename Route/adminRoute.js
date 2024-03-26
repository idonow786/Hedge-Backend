const express = require('express');
const router = express.Router();
const {signup,signin} = require('../Controller/Admin/Registration');
const {getAdminProfile} = require('../Controller/Admin/profile');
const {updateAdminProfile} = require('../Controller/Admin/updateProfile');
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  
router.post('/signup', signup);                                                                                   //working
router.post('/signin', signin);                                                                                   //working
router.get('/profile',verifyToken, getAdminProfile);                                                              //working
router.put('/profile/update', verifyToken, upload.single('profilePic'), updateAdminProfile);                      //working
 
module.exports = router;
