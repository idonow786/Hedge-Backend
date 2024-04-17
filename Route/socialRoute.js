const express = require('express');
const router = express.Router();

const multer = require('multer');
const {facebookAuth,facebookCallback,postToFacebook  } = require('../Controller/Social/facebook');
const { verifyToken } = require('../Middleware/jwt');

const app = express();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));







//FACEBOOK
router.post('/auth/facebook',verifyToken,  facebookAuth);
router.get('/auth/facebook/callback',  facebookCallback);

module.exports = router;
