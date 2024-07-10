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
const socialController = require('../Controller/Social/postSocial');
const { TwitterUser } = require('../Model/Twitter');








const { sendMessages } = require('../Controller/Social/Whatsapp/sendMessage')
const { verifyPhoneNumber } = require('../Controller/Social/Whatsapp/verifyPhone');
const { deleteMessage } = require('../Controller/Social/Whatsapp/deleteMessage');
const { verifyWebhook, handleWebhook } = require('../Controller/Social/Whatsapp/webhookController');
const { replyToCustomer, getAllMessages } = require('../Controller/Social/Whatsapp/replyMessage');






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
// router.get('/auth/twitter', verifyToken, (req, res) => {
//   try {
//     const state = encodeURIComponent(req.adminId);
//     console.log('Generated state:', state);
//     const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://crm-m3ck.onrender.com/api/social/auth/twitter/callback')}&scope=tweet.read%20tweet.write%20users.read%20follows.read%20offline.access&state=${state}&code_challenge_method=plain&code_challenge=${generateCodeChallenge()}`;
//     res.status(200).json({ authUrl });
//   } catch (error) {
//     console.error('Error generating Twitter authentication URL:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });



// router.get('/auth/twitter/callback',
//   passport.authenticate('twitter', { failureRedirect: '/failure' }),
//   (req, res) => {
//     res.redirect('/success');
//   }
// );

const { TwitterApi } = require('twitter-api-v2');

const { v4: uuidv4 } = require('uuid');

// Initialize Twitter client
const client = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

router.get('/auth/twitter', verifyToken, async (req, res) => {
  try {
    const state = encodeURIComponent(req.adminId);
    const sessionId = uuidv4(); // Generate a unique session ID

    const { url, codeVerifier, state: generatedState } = client.generateOAuth2AuthLink(
      'https://crm-m3ck.onrender.com/api/social/auth/twitter/callback',
      { scope: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'offline.access'], state }
    );

    // Save session and codeVerifier in the database
    const twitterUser = new TwitterUser({
      adminId: req.adminId,
      session: sessionId,
      codeVerifier,
      state: generatedState,
    });

    await twitterUser.save();

    res.status(200).json({ authUrl: url, sessionId });
  } catch (error) {
    console.error('Error generating Twitter authentication URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/auth/twitter/callback', async (req, res) => {
  try {
    const { state, code, sessionId } = req.query;
    console.log("query session",sessionId)
    console.log("query state",state)
    
    // Retrieve the saved session and codeVerifier from the database
    const twitterUser = await TwitterUser.findOne({ session: sessionId });

    if (!twitterUser) {
      throw new Error('Invalid session ID');
    }
    console.log("model state",twitterUser.state)
    // Verify state parameter
    if (state !== twitterUser.state) {
      console.log('Invalid state parameter');
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const { client: loggedClient, accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier: twitterUser.codeVerifier, // Include the code_verifier here
      redirectUri: 'https://crm-m3ck.onrender.com/api/social/auth/twitter/callback',
    });

    // Use loggedClient to make authenticated requests
    const { data: user } = await loggedClient.v2.me();

    // Update user details and tokens in the database
    twitterUser.userId = user.id;
    twitterUser.twitterId = user.id;
    twitterUser.accessToken = accessToken;
    twitterUser.refreshToken = refreshToken;
    twitterUser.name = user.name;
    twitterUser.username = user.username;

    await twitterUser.save();

    res.status(200).json({ message: 'Authentication successful', user: twitterUser });
  } catch (error) {
    console.error('Error during Twitter authentication:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
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
