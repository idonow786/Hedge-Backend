// controllers/tiktokController.js
const axios = require('axios');
const { OAuthTiktokData, TikTokUser } = require('../../Model/Tiktok');
const dotenv = require('dotenv');
dotenv.config();

const tiktokAuth = async (req, res) => {
  try {
    const csrfState = Math.random().toString(36).substring(7);
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${process.env.TIKTOK_REDIRECT_URI}&state=${csrfState}`;

    const oauthData = new OAuthTiktokData({
      state: csrfState,
      userId: req.adminId,
    });
    await oauthData.save();

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating TikTok auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const tiktokCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code or state is missing' });
    }

    const oauthData = await OAuthTiktokData.findOne({ state });

    if (!oauthData) {
      return res.status(400).json({ error: 'Invalid OAuth data' });
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

    let tiktokUser = await TikTokUser.findOne({ tiktokId: unique_id, userId: oauthData.userId });

    if (!tiktokUser) {
      tiktokUser = new TikTokUser({
        userId: oauthData.userId,
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

    await OAuthTiktokData.deleteOne({ _id: oauthData._id });

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
