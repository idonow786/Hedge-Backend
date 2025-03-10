// const express = require('express');
// const router = express.Router();
// const OAuth = require('oauth').OAuth;
// const crypto = require('crypto');
// const axios=require('axios')
// const multer = require('multer');
// const { facebookAuth, facebookCallback } = require('../Controller/Social/facebook');
// const { getAuthUrl,
//   handleCallback,
//   postTweet } = require('../Controller/Social/twitter');
// const { linkedinCallback, linkedinAuth } = require('../Controller/Social/linkedin');
// const { tiktokAuth, tiktokCallback } = require('../Controller/Social/tiktok');
// const socialController = require('../Controller/Social/postSocial');
// const { TwitterUser } = require('../Model/Twitter');








// const { sendMessages } = require('../Controller/Social/Whatsapp/sendMessage')
// const { verifyPhoneNumber } = require('../Controller/Social/Whatsapp/verifyPhone');
// const { deleteMessage } = require('../Controller/Social/Whatsapp/deleteMessage');
// const { verifyWebhook, handleWebhook } = require('../Controller/Social/Whatsapp/webhookController');
// const { replyToCustomer, getAllMessages } = require('../Controller/Social/Whatsapp/replyMessage');

// const OAuth2Strategy = require('passport-oauth2');





// const { verifyToken } = require('../Middleware/jwt');


// const passport = require('../Controller/Social/passport');











// const app = express();


// const upload = multer();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));








// ///////////////-----------------------------------facebook passport---------------------////////////////////////


// //FACEBOOK
// // router.post('/auth/facebook', verifyToken, facebookAuth);
// // router.get('/auth/facebook/callback', facebookCallback);





// //facebook passport
// router.get('/auth/facebook', verifyToken, (req, res) => {
//   console.log("APPID :", process.env.FACEBOOK_APP_ID)
//   // Generate the Facebook authentication URL with the adminId in the state parameter
//   const authUrl = `https://www.facebook.com/v9.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent('https://ai-crem-backend.onrender.com/api/social/auth/facebook/callback')}&state=${req.adminId}&scope=email,pages_manage_posts,pages_read_engagement`;

//   // Send the URL back to the client
//   res.status(200).json({ authUrl });
// });

// router.get('/auth/facebook/callback',
//   passport.authenticate('facebook', { failureRedirect: '/failure' }),
//   (req, res) => {
//     res.redirect('/success');
//   }
// );

// router.get('/success', (req, res) => res.send('Facebook account connected successfully'));
// router.get('/failure', (req, res) => res.send('Failed to connect Facebook account'));



// // --------------------------------------------------------////////////////////////







// //--------------------------------------------Instagram passport---------------------////////////////////////


// // router.get('/auth/instagram', verifyToken, (req, res) => {
// //   // Generate the Instagram authentication URL with the adminId in the state parameter
// //   const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/social/auth/instagram/callback')}&state=${req.adminId}&scope=user_profile,user_media`;

// //   // Send the URL back to the client
// //   res.status(200).json({ authUrl });
// // });

// // router.get('/auth/instagram/callback',
// //   passport.authenticate('instagram', { failureRedirect: '/failure' }),
// //   (req, res) => {
// //     res.redirect('/success');
// //   }
// // );

// // router.get('/success', (req, res) => res.send('Instagram account connected successfully'));
// // router.get('/failure', (req, res) => res.send('Failed to connect Instagram account'));



// // --------------------------------------------------------////////////////////////












// //==========================================LINKEDIN
// // LinkedIn Authentication
// // const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/social/auth/linkedin/callback')}&state=${req.adminId}&scope=openid%20profile%20email%20w_member_social`;
// //     res.status(200).json({ authUrl });


// router.get('/auth/linkedin', verifyToken, (req, res) => {
//   const state = encodeURIComponent(JSON.stringify({ adminId: req.adminId }));
//   const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://ai-crem-backend.onrender.com/api/social/auth/linkedin/callback')}&state=${state}&scope=openid%20profile%20email%20w_member_social`;
//   res.status(200).json({ authUrl });
// });

// router.get(
//   '/auth/linkedin/callback',
//   passport.authenticate('linkedin', { failureRedirect: '/auth/linkedin/failure' }),
//   (req, res) => {
//     res.redirect('/auth/linkedin/success');
//   }
// );

// router.get('/auth/linkedin/success', (req, res) => {
//   res.send('Social account connected successfully');
// });

// router.get('/auth/linkedin/failure', (req, res) => {
//   const error = req.query.error || 'Unknown error';
//   const errorDescription = req.query.error_description || 'No description available';
//   res.status(401).json({ error, errorDescription });
// });


// // ===============================================







// //--------============================

// //TWITTER
// // router.post('/auth/twitter', verifyToken, getAuthUrl);
// // router.get('/auth/twitter/callback', handleCallback);





// // Twitter Authentication
// // Helper function to generate code challenge
// function generateCodeChallenge() {
//   const verifier = crypto.randomBytes(32).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
//   return verifier;
// }

// // Routes
// router.get('/auth/twitter', verifyToken, async (req, res) => {
//   const adminId = req.adminId;
//   const codeVerifier = generateCodeVerifier();
//   const codeChallenge = generateCodeChallenge(codeVerifier);

//   // Save codeVerifier in the database
//   let twitterUser = await TwitterUser.findOne({ adminId: adminId });
//   if (!twitterUser) {
//     twitterUser = new TwitterUser({ adminId: adminId });
//   }
//   twitterUser.codeVerifier = codeVerifier;
//   await twitterUser.save();

//   const state = Buffer.from(JSON.stringify({ adminId })).toString('base64');

//   const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://ai-crem-backend.onrender.com/api/social/auth/twitter/callback')}&scope=tweet.read%20users.read%20follows.read%20follows.write&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

//   res.send(authUrl);
// });



// router.get('/auth/twitter/callback', async (req, res, next) => {
//   const { code, state } = req.query;

//   try {
//     const { adminId } = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

//     // Find the user by adminId
//     const twitterUser = await TwitterUser.findOne({ adminId: adminId });
//     if (!twitterUser || !twitterUser.codeVerifier) {
//       return res.status(400).send('Invalid request');
//     }

//     const codeVerifier = twitterUser.codeVerifier;

//     const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', 
//       new URLSearchParams({
//         code,
//         grant_type: 'authorization_code',
//         client_id: process.env.TWITTER_CLIENT_ID,
//         redirect_uri: 'https://ai-crem-backend.onrender.com/api/social/auth/twitter/callback',
//         code_verifier: codeVerifier
//       }), 
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
//         }
//       }
//     );

//     const { access_token, refresh_token } = tokenResponse.data;

//     // Update the user with the new tokens
//     twitterUser.accessToken = access_token;
//     twitterUser.refreshToken = refresh_token;
//     twitterUser.codeVerifier = null; // Clear the code verifier
//     await twitterUser.save();

//     // Set the adminId in the session for the passport strategy
//     req.session.adminId = adminId;

//     next();
//   } catch (error) {
//     console.error('Error exchanging code for tokens:', error.response ? error.response.data : error.message);
//     return res.status(500).send('Authentication failed');
//   }
// }, 
// passport.authenticate('twitter', { failureRedirect: '/api/social/failure' }),
// (req, res) => {
//   res.redirect('/api/social/success');
// });





// // ========================================================


// router.get('/auth/snapchat', passport.authenticate('snapchat'));

// router.get('/auth/snapchat/callback', passport.authenticate('snapchat', {
//   failureRedirect: '/login',
// }), (req, res) => {
//   res.redirect('/dashboard');
// });
// //=========================================================















// //================================================================
// // Function to get the TikTok authorization URL
// async function getTikTokAuthUrl(state) {
//   const clientId = process.env.TIKTOK_CLIENT_KEY
//   const redirectUri = 'https://ai-crem-backend.onrender.com/api/social/auth/tiktok/callback';
//   const scope = 'video.upload'; // Requesting permission to post on TikTok

//   const authUrl = `https://open-api.tiktok.com/platform/oauth/connect/?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

//   return authUrl;
// }

// // Generate the TikTok authorization URL and send it in the response
// router.get('/auth/tiktok', verifyToken, async (req, res) => {
//   const adminId = req.adminId;
//   if (!adminId) {
//     return res.status(400).send('adminId is required');
//   }

//   const state = adminId; // Save the adminId as the state

//   try {
//     const authUrl = await getTikTokAuthUrl(state);
//     res.status(200).json({ authUrl });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Handle the TikTok callback
// router.get('/auth/tiktok/callback', async (req, res) => {
//   const { code, state } = req.query;
//   const adminId = state;

//   try {
//     const response = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
//       client_key: process.env.TIKTOK_CLIENT_KEY,
//       client_secret:process.env.TIKTOK_CLIENT_SECRET,
//       code: code,
//       grant_type: 'authorization_code',
//     });

//     const { data } = response;
//     if (data.error_code) {
//       throw new Error(data.description);
//     }

//     const { access_token, refresh_token, open_id } = data.data;

//     // Fetch user info from TikTok
//     const userInfoResponse = await axios.get(`https://open-api.tiktok.com/oauth/userinfo/?access_token=${access_token}&open_id=${open_id}`);
//     const { data: userInfo } = userInfoResponse;

//     const { nickname: username, open_id: tiktokId } = userInfo.data;

//     // Save the access token and other details in the TikTokUser model
//     const tiktokUser = new TikTokUser({
//       userId: adminId,
//       tiktokId: tiktokId,
//       accessToken: access_token,
//       refreshToken: refresh_token,
//       openId: open_id,
//       username: username,
//     });

//     await tiktokUser.save();

//     res.redirect('/dashboard'); // Redirect to the desired page after successful authentication
//   } catch (error) {
//     console.error('Error handling TikTok callback:', error.message);
//     res.status(500).send('Internal Server Error');
//   }
// });


// // =============================






// //Facebook Pages Get
// router.get('/pages', verifyToken, socialController.getFacebookPages);




// router.post('/posts', verifyToken, upload.array('files'), socialController.createPost);
// router.get('/posts', verifyToken, socialController.getPosts);
// router.put('/posts', verifyToken, socialController.updatePost);
// router.delete('/posts', verifyToken, socialController.deletePost);








// // /======================================================================whatsapp
// router.post('/whatsapp/verify/number', verifyToken, verifyPhoneNumber);
// router.post('/whatsapp/sendmessage', verifyToken, sendMessages);
// router.delete('/whatsapp/deletemessage', verifyToken, deleteMessage);
// router.get('/whatsapp/verify/webhook', verifyWebhook);
// router.post('/whatsapp/verify/webhook', handleWebhook);
// router.post('/whatsapp/reply/customer', verifyToken, replyToCustomer);
// router.get('/whatsapp/messages', verifyToken, getAllMessages);



// module.exports = router;
