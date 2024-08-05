const express = require('express');
const router = express.Router();

const { loginUser } = require('../../Controller/Gaap/User/login.gaap')
const { getUserProfile} = require('../../Controller/Gaap/User/profile.gaap')
const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.get('/login', loginUser);                                             //
router.put('/update', verifyToken, getUserProfile);                          //






module.exports = router;

