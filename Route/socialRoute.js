const express = require('express');
const router = express.Router();
const OAuth = require('oauth').OAuth;

const multer = require('multer');
const { facebookAuth, facebookCallback } = require('../Controller/Social/facebook');
const { getAuthUrl,
    handleCallback,
    postTweet } = require('../Controller/Social/twitter');
const { linkedinCallback, linkedinAuth } = require('../Controller/Social/linkedin');
const { tiktokAuth, tiktokCallback } = require('../Controller/Social/tiktok');


const { verifyToken } = require('../Middleware/jwt');


const passport = require('../Controller/Social/passport');











const app = express();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));








///////////////-----------------------------------facebook passport---------------------////////////////////////


//FACEBOOK
// router.post('/auth/facebook', verifyToken, facebookAuth);
// router.get('/auth/facebook/callback', facebookCallback);





//facebook passport
router.get('/auth/facebook', verifyToken, (req, res) => {
  console.log("APPID :",process.env.FACEBOOK_APP_ID)
  // Generate the Facebook authentication URL with the adminId in the state parameter
  const authUrl = `https://www.facebook.com/v9.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent('https://crm-m3ck.onrender.com/api/social/auth/facebook/callback')}&state=${req.adminId}&scope=email,pages_manage_posts,pages_read_engagement`;

  // Send the URL back to the client
  res.status(200).json({ authUrl });
});

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/failure' }),
  (req, res) => {
    res.redirect('/success');
  }
);

router.get('/success', (req, res) => res.send('Facebook account connected successfully'));
router.get('/failure', (req, res) => res.send('Failed to connect Facebook account'));



// --------------------------------------------------------////////////////////////







//--------------------------------------------Instagram passport---------------------////////////////////////


// router.get('/auth/instagram', verifyToken, (req, res) => {
//   // Generate the Instagram authentication URL with the adminId in the state parameter
//   const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/social/auth/instagram/callback')}&state=${req.adminId}&scope=user_profile,user_media`;

//   // Send the URL back to the client
//   res.status(200).json({ authUrl });
// });

// router.get('/auth/instagram/callback',
//   passport.authenticate('instagram', { failureRedirect: '/failure' }),
//   (req, res) => {
//     res.redirect('/success');
//   }
// );

// router.get('/success', (req, res) => res.send('Instagram account connected successfully'));
// router.get('/failure', (req, res) => res.send('Failed to connect Instagram account'));



// --------------------------------------------------------////////////////////////












//==========================================LINKEDIN
// router.get('/auth/linkedin', verifyToken, linkedinAuth);
// router.get('/auth/linkedin/callback', linkedinCallback);

// LinkedIn Authentication
// LinkedIn Authentication

// LinkedIn Authentication
router.get('/auth/linkedin', verifyToken, (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://crm-m3ck.onrender.com/api/social/auth/linkedin/callback')}&state=${req.adminId}&scope=r_liteprofile%20email%20w_member_social`;
  res.status(200).json({ authUrl });
});

router.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/failure' }),
  (req, res) => {
    res.redirect('/success');
  }
);

router.get('/success', (req, res) => res.send('Social account connected successfully'));
router.get('/failure', (req, res) => res.send('Failed to connect social account'));

// ===============================================







//--------============================

//TWITTER
// router.post('/auth/twitter', verifyToken, getAuthUrl);
// router.get('/auth/twitter/callback', handleCallback);





// Twitter Authentication
router.get('/auth/twitter', verifyToken, (req, res) => {
  passport.authenticate('twitter', { state: req.adminId })(req, res);
});


router.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/failure' }),
  (req, res) => {
    res.redirect('/success');
  }
);

router.get('/success', (req, res) => res.send('Social account connected successfully'));
router.get('/failure', (req, res) => res.send('Failed to connect social account'));








// ========================================================








module.exports = router;
