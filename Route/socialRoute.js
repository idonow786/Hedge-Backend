const express = require('express');
const router = express.Router();

const multer = require('multer');
const {facebookAuth,facebookCallback  } = require('../Controller/Social/facebook');
const {  getAuthUrl,
    handleCallback,
    postTweet  } = require('../Controller/Social/twitter');
const { linkedinCallback,linkedinAuth} = require('../Controller/Social/linkedin');
const {tiktokAuth,tiktokCallback} = require('../Controller/Social/tiktok');


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
router.post('/auth/twitter',verifyToken,  getAuthUrl);
router.get('/auth/twitter/callback',  handleCallback);




//LINKEDIN
router.get('/auth/linkedin',verifyToken,  linkedinAuth);
router.get('/auth/linkedin/callback',  linkedinCallback);



//Tiktok
router.get('/auth/tiktok',verifyToken,  tiktokAuth);
router.get('/auth/tiktok/callback',  tiktokCallback);
module.exports = router;
