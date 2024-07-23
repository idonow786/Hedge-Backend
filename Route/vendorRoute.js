const express = require('express');
const router = express.Router();

const { addVendor, getVendors, updateVendor, deleteVendor } = require('../Controller/Vendor/addVendor')
const { getVendorTasksInfo} = require('../Controller/Vendor/getTasks')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.post('/add', verifyToken, addVendor);                                                               //working
router.get('/get', verifyToken, getVendors);                                                              //working
router.put('/update', verifyToken, updateVendor);                                                            //working
router.delete('/delete', verifyToken, deleteVendor);                                                            //working




router.get('/tasks', verifyToken, getVendorTasksInfo);                                                            //working


module.exports = router;

