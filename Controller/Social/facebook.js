const FacebookUser = require('../../Model/Facebook');
const axios = require('axios');

const AuthFacebook = (req, res) => {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const adminId = req.adminId;
    const redirectUri = `https://crm-m3ck.onrender.com/auth/facebook/callback`;
    const scope = ['email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'].join(',');
    const authUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Facebook authentication link:', error);
    res.status(500).json({ error: 'An error occurred while generating the Facebook authentication link' });
  }
};

const facebookAuthCallback = async (req, res) => {
  try {
    const { code, adminId } = req.query;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `https://crm-m3ck.onrender.com/auth/facebook/callback`;

    const tokenResponse = await axios.get(`https://graph.facebook.com/v10.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    const { id: facebookId, name, email } = userResponse.data;

    const existingUser = await FacebookUser.findOne({ facebookId });

    if (existingUser) {
      existingUser.accessToken = accessToken;
      await existingUser.save();
      res.json({ message: 'User details updated successfully' });
    } else {
      const newUser = new FacebookUser({
        userId: adminId,
        facebookId,
        accessToken,
        name,
        email
      });
      await newUser.save();
      res.json({ message: 'User details saved successfully' });
    }
  } catch (error) {
    console.error('Error handling Facebook callback:', error);
    res.status(500).json({ error: 'An error occurred while handling the Facebook callback' });
  }
};

module.exports = { facebookAuthCallback, AuthFacebook };


















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