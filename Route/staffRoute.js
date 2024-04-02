const express = require('express');
const router = express.Router();
const { addStaff } = require('../Controller/Staff/addStaff')
const { deletestaff } = require('../Controller/Staff/deleteStaff')
const { updatestaff } = require('../Controller/Staff/updateStaff')
const { getstaffs } = require('../Controller/Staff/getStaff')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});


router.post('/add', verifyToken, upload.single('profilePic'), addStaff);                               //working
router.put('/update', verifyToken, upload.single('profilePic'), updatestaff);                      //working
router.delete('/remove', verifyToken, deletestaff);                                                //working
router.get('/get', verifyToken, getstaffs);                                                            //working

module.exports = router;

