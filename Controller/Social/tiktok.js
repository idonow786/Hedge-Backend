// controllers/tiktokController.js
const axios = require('axios');
const { TikTokUser } = require('../../Model/Tiktok');
const dotenv = require('dotenv');
dotenv.config();

const tiktokAuth = async (req, res) => {
  try {
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${process.env.TIKTOK_REDIRECT_URI}`;

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating TikTok auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const tiktokCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }

    const accessTokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', null, {
      params: {
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
      },
    });

    const { access_token, refresh_token, open_id } = accessTokenResponse.data.data;

    const userInfoResponse = await axios.get('https://open-api.tiktok.com/user/info/', {
      params: {
        access_token: access_token,
        open_id: open_id,
      },
    });

    const { unique_id, nickname } = userInfoResponse.data.data.user;

    let tiktokUser = await TikTokUser.findOne({ tiktokId: unique_id, userId: req.adminId });

    if (!tiktokUser) {
      tiktokUser = new TikTokUser({
        userId: 'req.adminId',
        tiktokId: unique_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        openId: open_id,
        username: nickname,
      });
      await tiktokUser.save();
    } else {
      tiktokUser.accessToken = access_token;
      tiktokUser.refreshToken = refresh_token;
      await tiktokUser.save();
    }

    res.status(200).json({ message: 'TikTok account connected successfully' });
  } catch (error) {
    console.error('Error handling TikTok callback:', error);
    if (error.response && error.response.data && error.response.data.message) {
      res.status(error.response.status).json({ error: error.response.data.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = { tiktokAuth, tiktokCallback };
