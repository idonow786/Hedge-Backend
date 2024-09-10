const express = require('express');
const router = express.Router();
const { updateUserAndBusiness,createUserAndBusiness,deleteUserAndBusiness,getAllUsersWithBusinesses } = require('../Controller/Admin//hr.controller');
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.put('/update', verifyToken, updateUserAndBusiness);                                                              //working
router.post('/add', verifyToken, createUserAndBusiness);                                                  //working
router.delete('/remove', verifyToken, deleteUserAndBusiness);                                                             //working
router.get('/get', verifyToken, getAllUsersWithBusinesses);                                                    //working

module.exports = router;
