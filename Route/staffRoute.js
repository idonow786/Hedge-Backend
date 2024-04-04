const express = require('express');
const router = express.Router();
const { addStaff } = require('../Controller/Staff/addStaff')
const { deleteStaff } = require('../Controller/Staff/deleteStaff')
const { updateStaff } = require('../Controller/Staff/updateStaff')
const { getStaffs } = require('../Controller/Staff/getStaff')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});


router.post('/add', verifyToken, upload.single('profilePic'), addStaff);                               //working
router.put('/update', verifyToken, upload.single('profilePic'), updateStaff);                      //working
router.delete('/remove', verifyToken, deleteStaff);                                                //working
router.get('/get', verifyToken, getStaffs);                                                            //working

module.exports = router;

