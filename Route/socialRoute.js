const express = require('express');
const router = express.Router();

const multer = require('multer');
const {facebookAuthCallback,AuthFacebook  } = require('../Controller/Social/facebook');
const { verifyToken } = require('../Middleware/jwt');

const app = express();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));







//FACEBOOK
router.post('/auth/facebook',verifyToken,  AuthFacebook);
router.post('/auth/facebook/callback',verifyToken,  facebookAuthCallback);

module.exports = router;
