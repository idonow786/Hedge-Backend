// controllers/instagramController.js
const axios = require('axios');
const InstagramUser = require('../../Model/Instagram');
const OAuthData = require('../../Model/OAuthData');

const instagramAuth = async (req, res) => {
  try {
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
    const state = Math.random().toString(36).substring(7);

    const oauthData = new OAuthData({
      state,
      userId: req.adminId,
    });
    await oauthData.save();

    res.status(200).json({ authUrl: `${authUrl}&state=${state}` });
  } catch (error) {
    console.error('Error generating Instagram auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const instagramCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code or state is missing' });
    }

    const oauthData = await OAuthData.findOne({ state });

    if (!oauthData) {
      return res.status(400).json({ error: 'Invalid OAuth data' });
    }

    const accessTokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code: code,
    });

    const { access_token, user_id, username } = accessTokenResponse.data;

    let instagramUser = await InstagramUser.findOne({ instagramId: user_id, userId: oauthData.userId });

    if (!instagramUser) {
      instagramUser = new InstagramUser({
        userId: oauthData.userId,
        instagramId: user_id,
        accessToken: access_token,
        username: username,
      });
      await instagramUser.save();
    } else {
      instagramUser.accessToken = access_token;
      await instagramUser.save();
    }

    await OAuthData.deleteOne({ _id: oauthData._id });

    res.status(200).json({ message: 'Instagram account connected successfully' });
  } catch (error) {
    console.error('Error handling Instagram callback:', error);
    if (error.response && error.response.data && error.response.data.error_message) {
      res.status(error.response.status).json({ error: error.response.data.error_message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};


module.exports={instagramAuth,instagramCallback}