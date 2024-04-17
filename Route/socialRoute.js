const express = require('express');
const router = express.Router();

const multer = require('multer');
const {facebookAuth,facebookCallback  } = require('../Controller/Social/facebook');
const {  getAuthUrl,
    handleCallback,
    postTweet,  } = require('../Controller/Social/twitter');
const { verifyToken } = require('../Middleware/jwt');

const app = express();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));







//FACEBOOK
router.post('/auth/facebook',verifyToken,  facebookAuth);
router.get('/auth/facebook/callback',  facebookCallback);



//TWITTER
router.get('/auth/twitter',  getAuthUrl);
router.get('/auth/twitter/callback',  handleCallback);

module.exports = router;
