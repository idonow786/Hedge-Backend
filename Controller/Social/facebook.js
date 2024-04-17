const axios = require('axios');
const FacebookUser = require('../../Model/Facebook');

const facebookAuth = (req, res) => {
  const adminID=req.adminId;
  const FACEBOOK_REDIRECT_URI=`https://crm-m3ck.onrender.com/api/social/auth/facebook/callback?adminId=${adminID}`
  const authUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=pages_manage_posts,pages_read_engagement`;
  res.send(authUrl);
};

const facebookCallback = async (req, res) => {
  try {
    const { code,adminId } = req.query;
    const FACEBOOK_REDIRECT_URI='https://crm-m3ck.onrender.com/api/social/auth/facebook/callback'
    const accessTokenUrl = `https://graph.facebook.com/v10.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`;
    const response = await axios.get(accessTokenUrl);
    const accessToken = response.data.access_token;

    const userInfoUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`;
    const userInfoResponse = await axios.get(userInfoUrl);
    const { id: facebookId, name, email } = userInfoResponse.data;

    const userId =adminId; 
    const facebookUser = await FacebookUser.findOneAndUpdate(
      { userId },
      { facebookId, accessToken, name, email },
      { upsert: true, new: true }
    );

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error in Facebook callback:', error);
    res.status(500).json({ success: false, error: 'Failed to authenticate with Facebook' });
  }
};

const postToFacebook = async (req, res) => {
  try {
    const { message, pictureUrl } = req.body;
    const userId = req.user.id; 

    const facebookUser = await FacebookUser.findOne({ userId });
    if (!facebookUser) {
      return res.status(404).json({ success: false, error: 'Facebook account not found' });
    }

    const { accessToken } = facebookUser;

    // Post content to Facebook
    const response = await axios.post(`https://graph.facebook.com/me/photos?access_token=${accessToken}`, {
      message,
      url: pictureUrl,
    });

    res.status(200).json({ success: true, postId: response.data.id });
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    res.status(500).json({ success: false, error: 'Failed to post to Facebook' });
  }
};



module.exports={facebookAuth,facebookCallback,postToFacebook}




// //
// const express = require('express');
// const FacebookUser = require('./facebookUser');

// const router = express.Router();

// // Generate Facebook authentication link
// router.get('/auth/facebook', (req, res) => {
//   try {
//     const appId = process.env.FACEBOOK_APP_ID;
//     const redirectUri = 'http://localhost:3000/auth/facebook/callback';
//     const scope = ['email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'].join(',');
//     const authUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

//     res.json({ authUrl });
//   } catch (error) {
//     console.error('Error generating Facebook authentication link:', error);
//     res.status(500).json({ error: 'An error occurred while generating the Facebook authentication link' });
//   }
// });

// // Handle user details after authentication
// router.post('/auth/facebook/callback', async (req, res) => {
//   try {
//     const { userId, facebookId, accessToken, name, email } = req.body;

//     const existingUser = await FacebookUser.findOne({ facebookId });

//     if (existingUser) {
//       // If the user already exists, update the access token
//       existingUser.accessToken = accessToken;
//       await existingUser.save();
//       res.json({ message: 'User details updated successfully' });
//     } else {
//       // If the user doesn't exist, create a new user in the database
//       const newUser = new FacebookUser({
//         userId,
//         facebookId,
//         accessToken,
//         name,
//         email
//       });
//       await newUser.save();
//       res.json({ message: 'User details saved successfully' });
//     }
//   } catch (error) {
//     console.error('Error handling user details:', error);
//     res.status(500).json({ error: 'An error occurred while handling user details' });
//   }
// });

// module.exports = router;