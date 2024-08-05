const express = require('express');
const router = express.Router();

const { registerUser} = require('../../Controller/Gaap/User/register.gaap')
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



router.post('/register', registerUser);                                      //
router.get('/login', loginUser);                                             //
router.put('/update', verifyToken, getUserProfile);                          //






module.exports = router;

