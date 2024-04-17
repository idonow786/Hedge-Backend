// controllers/facebookController.js
const Facebook = require('facebook-node-sdk');
const FacebookUser = require('../../Model/Facebook');

const facebookAuth = (req, res) => {
  try {
    const facebook = new Facebook({
      appID: process.env.FACEBOOK_APP_ID,
      secret: process.env.FACEBOOK_APP_SECRET
    });

    const authUrl = facebook.getLoginUrl({
      scope: 'email,pages_show_list,pages_manage_posts',
      redirect_uri: 'https://crm-m3ck.onrender.com/api/social/auth/facebook/callback'
    });

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const facebookCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const facebook = new Facebook({
      appID: process.env.FACEBOOK_APP_ID,
      secret: process.env.FACEBOOK_APP_SECRET
    });

    const { access_token } = await facebook.api('oauth/access_token', {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: 'https://crm-m3ck.onrender.com/api/social/auth/facebook/callback',
      code
    });

    const { id, name, email } = await facebook.api('/me', { fields: 'id,name,email', access_token });

    let facebookUser = await FacebookUser.findOne({ facebookId: id });

    if (!facebookUser) {
      facebookUser = new FacebookUser({
        userId: req.user._id,
        facebookId: id,
        accessToken: access_token,
        name,
        email
      });
      await facebookUser.save();
    } else {
      facebookUser.accessToken = access_token;
      await facebookUser.save();
    }

    res.status(200).json({ message: 'Facebook account connected successfully' });
  } catch (error) {
    console.error('Error handling Facebook callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { facebookAuth, facebookCallback };

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