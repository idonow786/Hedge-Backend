
// controllers/facebookController.js
const Facebook = require('facebook-js-sdk');
const {OAuthDataFacebook,FacebookUser} = require('../../Model/Facebook');


const facebookAuth = async (req, res) => {
  try {
    const facebook = new Facebook({
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      redirectUrl: 'https://crm-m3ck.onrender.com/api/social/auth/facebook/callback',
      graphVersion: 'v19.0',
    });

    const authUrl = facebook.getLoginUrl();
    const state = new URL(authUrl).searchParams.get('state');

    const oauthData = new OAuthDataFacebook({
      state,
      userId: req.adminId,
    });
    await oauthData.save();

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const facebookCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code or state is missing' });
    }

    const oauthData = await OAuthDataFacebook.findOne({ state });

    if (!oauthData) {
      return res.status(400).json({ error: 'Invalid OAuth data' });
    }

    const facebook = new Facebook({
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      redirectUrl: 'https://crm-m3ck.onrender.com/api/social/auth/facebook/callback',
      graphVersion: 'v19.0',
    });

    const accessToken = await facebook.callback(code);

    if (!accessToken) {
      return res.status(401).json({ error: 'Failed to obtain access token' });
    }

    const profile = await facebook.get('/me', { fields: 'id,name,email' });

    if (!profile || !profile.id || !profile.name || !profile.email) {
      return res.status(400).json({ error: 'Incomplete profile data received from Facebook' });
    }

    let facebookUser = await FacebookUser.findOne({ facebookId: profile.id, userId: oauthData.userId });

    if (!facebookUser) {
      facebookUser = new FacebookUser({
        userId: oauthData.userId,
        facebookId: profile.id,
        accessToken: accessToken,
        name: profile.name,
        email: profile.email,
      });
      await facebookUser.save();
    } else {
      facebookUser.accessToken = accessToken;
      await facebookUser.save();
    }

    await OAuthData.deleteOne({ _id: oauthData._id });

    res.status(200).json({ message: 'Facebook account connected successfully' });
  } catch (error) {
    console.error('Error handling Facebook callback:', error);
    if (error.response && error.response.data && error.response.data.error) {
      res.status(error.response.status).json({ error: error.response.data.error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
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