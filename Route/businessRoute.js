const express = require('express');
const router = express.Router();
const {addBusiness} = require('../Controller/Business/addBusiness')
const {updateBusiness} = require('../Controller/Business/updateBusiness')
const {deleteBusiness} = require('../Controller/Business/deleteBusiness')
const {getBusinesss, getAtisBusinesses, getAccountingBusinesses} = require('../Controller/Business/getBusiness')
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

router.post('/add', verifyToken, addBusiness);
router.put('/update', verifyToken, upload.single('logo'), updateBusiness);
router.delete('/remove', verifyToken, deleteBusiness);
router.get('/get', verifyToken, getBusinesss);
router.get('/get-atis', verifyToken, getAtisBusinesses);
router.get('/get-accounting', verifyToken, getAccountingBusinesses);
 
module.exports = router;

