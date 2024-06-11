const express = require('express');
const router = express.Router();
const OAuth = require('oauth').OAuth;
const crypto = require('crypto');

const multer = require('multer');
const { facebookAuth, facebookCallback } = require('../Controller/Social/facebook');
const { getAuthUrl,
    handleCallback,
    postTweet } = require('../Controller/Social/twitter');
const { linkedinCallback, linkedinAuth } = require('../Controller/Social/linkedin');
const { tiktokAuth, tiktokCallback } = require('../Controller/Social/tiktok');
const  socialController  = require('../Controller/Social/postSocial');


const { verifyToken } = require('../Middleware/jwt');


const passport = require('../Controller/Social/passport');











const app = express();


const upload = multer();


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
  const authUrl = `https://www.facebook.com/v9.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent('https://ai-crem-backend.onrender.com/api/social/auth/facebook/callback')}&state=${req.adminId}&scope=email,pages_manage_posts,pages_read_engagement`;

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
  try {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://crm-m3ck.onrender.com/api/social/auth/linkedin/callback')}&state=${req.adminId}&scope=openid%20profile%20email%20w_member_social`;
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating LinkedIn authentication URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/api/social/linkedin/failure' }),
  (req, res) => {
    res.redirect('/api/social/linkedin/success');
  },
  (err, req, res, next) => {
    console.error('LinkedIn authentication error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
);

router.get('/linkedin/success', (req, res) => res.send('Social account connected successfully'));
router.get('/linkedin/failure', (req, res) => {
  const error = req.query.error || 'Unknown error';
  const errorDescription = req.query.error_description || 'No description available';
  res.status(401).json({ error, errorDescription });
});

// ===============================================







//--------============================

//TWITTER
// router.post('/auth/twitter', verifyToken, getAuthUrl);
// router.get('/auth/twitter/callback', handleCallback);





// Twitter Authentication
router.get('/auth/twitter', verifyToken, (req, res) => {
  try {
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://ai-crem-backend.onrender.com/api/social/auth/twitter/callback')}&scope=tweet.read%20users.read%20follows.read%20offline.access&state=${encodeURIComponent(req.adminId)}&code_challenge_method=plain&code_challenge=${generateCodeChallenge()}`;
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating Twitter authentication URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/failure' }),
  (req, res) => {
    res.redirect('/success');
  }
);

router.get('/success', (req, res) => res.send('Social account connected successfully'));

router.get('/failure', (req, res) => {
  const error = req.query.error || 'Unknown error';
  res.status(401).send(`Failed to connect social account: ${error}`);
});

// Helper function to generate code challenge for PKCE
function generateCodeChallenge() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest());
  return codeChallenge;
}

// Helper function to generate random string for code verifier
function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Helper function to base64URL encode a string
function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}





// ========================================================







router.post('/posts', verifyToken, upload.array('files'), socialController.createPost);
router.get('/posts', verifyToken, socialController.getPosts);
router.put('/posts', verifyToken, socialController.updatePost);
router.delete('/posts', verifyToken, socialController.deletePost);




module.exports = router;
