const express = require('express');
const router = express.Router();
const OAuth = require('oauth').OAuth;
const crypto = require('crypto');
const axios=require('axios')
const multer = require('multer');
const { facebookAuth, facebookCallback } = require('../Controller/Social/facebook');
const { getAuthUrl,
  handleCallback,
  postTweet } = require('../Controller/Social/twitter');
const { linkedinCallback, linkedinAuth } = require('../Controller/Social/linkedin');
const { tiktokAuth, tiktokCallback } = require('../Controller/Social/tiktok');
const socialController = require('../Controller/Social/postSocial');
const { TwitterUser } = require('../Model/Twitter');








const { sendMessages } = require('../Controller/Social/Whatsapp/sendMessage')
const { verifyPhoneNumber } = require('../Controller/Social/Whatsapp/verifyPhone');
const { deleteMessage } = require('../Controller/Social/Whatsapp/deleteMessage');
const { verifyWebhook, handleWebhook } = require('../Controller/Social/Whatsapp/webhookController');
const { replyToCustomer, getAllMessages } = require('../Controller/Social/Whatsapp/replyMessage');

const OAuth2Strategy = require('passport-oauth2');





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
  console.log("APPID :", process.env.FACEBOOK_APP_ID)
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
// LinkedIn Authentication
// const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/social/auth/linkedin/callback')}&state=${req.adminId}&scope=openid%20profile%20email%20w_member_social`;
//     res.status(200).json({ authUrl });


router.get('/auth/linkedin', verifyToken, (req, res) => {
  const state = encodeURIComponent(JSON.stringify({ adminId: req.adminId }));
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://crm-m3ck.onrender.com/api/social/auth/linkedin/callback')}&state=${state}&scope=openid%20profile%20email%20w_member_social`;
  res.status(200).json({ authUrl });
});

router.get(
  '/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/auth/linkedin/failure' }),
  (req, res) => {
    res.redirect('/auth/linkedin/success');
  }
);

router.get('/auth/linkedin/success', (req, res) => {
  res.send('Social account connected successfully');
});

router.get('/auth/linkedin/failure', (req, res) => {
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
    const state = crypto.randomBytes(16).toString('hex');
    req.session.adminId = req.adminId;
    req.session.twitterState = state;
    
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://crm-m3ck.onrender.com/api/social/auth/twitter/callback')}&scope=tweet.read%20tweet.write%20users.read%20follows.read%20offline.access&state=${state}&code_challenge_method=plain&code_challenge=${generateCodeChallenge()}`;
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating Twitter authentication URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/auth/twitter/callback', (req, res, next) => {
  const state = req.query.state;
  if (state !== req.session.twitterState) {
    return res.status(400).send('Invalid state parameter');
  }
  passport.authenticate('twitter', { failureRedirect: '/api/social/failure' })(req, res, next);
}, (req, res) => {
  res.redirect('/api/social/success');
});

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
  return crypto.randomBytes(length).toString('hex');
}

// Helper function to base64URL encode a string
function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}




// ========================================================


router.get('/auth/snapchat', passport.authenticate('snapchat'));

router.get('/auth/snapchat/callback', passport.authenticate('snapchat', {
  failureRedirect: '/login',
}), (req, res) => {
  res.redirect('/dashboard');
});
//=========================================================















//================================================================
// Function to get the TikTok authorization URL
async function getTikTokAuthUrl(state) {
  const clientId = process.env.TIKTOK_CLIENT_KEY
  const redirectUri = 'https://crm-m3ck.onrender.com/api/social/auth/tiktok/callback';
  const scope = 'video.upload'; // Requesting permission to post on TikTok

  const authUrl = `https://open-api.tiktok.com/platform/oauth/connect/?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

  return authUrl;
}

// Generate the TikTok authorization URL and send it in the response
router.get('/auth/tiktok', verifyToken, async (req, res) => {
  const adminId = req.adminId;
  if (!adminId) {
    return res.status(400).send('adminId is required');
  }

  const state = adminId; // Save the adminId as the state

  try {
    const authUrl = await getTikTokAuthUrl(state);
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Handle the TikTok callback
router.get('/auth/tiktok/callback', async (req, res) => {
  const { code, state } = req.query;
  const adminId = state;

  try {
    const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret:process.env.TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
    });

    const { data } = response;
    if (data.error_code) {
      throw new Error(data.description);
    }

    const { access_token, refresh_token, open_id } = data.data;

    // Fetch user info from TikTok
    const userInfoResponse = await axios.get(`https://open-api.tiktok.com/oauth/userinfo/?access_token=${access_token}&open_id=${open_id}`);
    const { data: userInfo } = userInfoResponse;

    const { nickname: username, open_id: tiktokId } = userInfo.data;

    // Save the access token and other details in the TikTokUser model
    const tiktokUser = new TikTokUser({
      userId: adminId,
      tiktokId: tiktokId,
      accessToken: access_token,
      refreshToken: refresh_token,
      openId: open_id,
      username: username,
    });

    await tiktokUser.save();

    res.redirect('/dashboard'); // Redirect to the desired page after successful authentication
  } catch (error) {
    console.error('Error handling TikTok callback:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


// =============================






//Facebook Pages Get
router.get('/pages', verifyToken, socialController.getFacebookPages);




router.post('/posts', verifyToken, upload.array('files'), socialController.createPost);
router.get('/posts', verifyToken, socialController.getPosts);
router.put('/posts', verifyToken, socialController.updatePost);
router.delete('/posts', verifyToken, socialController.deletePost);








// /======================================================================whatsapp
router.post('/whatsapp/verify/number', verifyToken, verifyPhoneNumber);
router.post('/whatsapp/sendmessage', verifyToken, sendMessages);
router.delete('/whatsapp/deletemessage', verifyToken, deleteMessage);
router.get('/whatsapp/verify/webhook', verifyWebhook);
router.post('/whatsapp/verify/webhook', handleWebhook);
router.post('/whatsapp/reply/customer', verifyToken, replyToCustomer);
router.get('/whatsapp/messages', verifyToken, getAllMessages);



module.exports = router;
