const express = require('express');
const router = express.Router();
const {signup,signin} = require('../Controller/Admin/Registration');
const {getAdminProfile} = require('../Controller/Admin/profile');
const {updateAdminProfile} = require('../Controller/Admin/updateProfile');
const {verifyToken} = require('../Middleware/jwt');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/profile',verifyToken, getAdminProfile);
router.put('/profile/update', verifyToken, upload.single('profilePic'), updateAdminProfile);

module.exports = router;
