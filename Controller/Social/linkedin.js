const { RestliClient } = require('linkedin-api-client');
const { OAuthDataLinkedin, LinkedInUser } = require('../../Model/Linkedin');

// Auth controller
const linkedinAuth = async (req, res) => {
  try {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&scope=r_liteprofile%20r_emailaddress`;
    const state = Math.random().toString(36).substring(7);

    const oauthData = new OAuthDataLinkedin({
      state,
      userId: req.adminId,
    });
    await oauthData.save();

    res.status(200).json({ authUrl: `${authUrl}&state=${state}` });
  } catch (error) {
    console.error('Error generating LinkedIn auth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Callback controller
const linkedinCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code or state is missing' });
    }

    const oauthData = await OAuthDataLinkedin.findOne({ state });

    if (!oauthData) {
      return res.status(400).json({ error: 'Invalid OAuth data' });
    }

    if (state !== oauthData.state) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const restliClient = new RestliClient();

    const accessTokenResponse = await restliClient.post({
      resourcePath: '/oauth/v2/accessToken',
      params: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    });

    const { access_token } = accessTokenResponse.data;

    const profileResponse = await restliClient.get({
      resourcePath: '/me',
      accessToken: access_token,
    });

    const emailResponse = await restliClient.get({
      resourcePath: '/emailAddress?q=members&projection=(elements*(handle~))',
      accessToken: access_token,
    });

    const { id, localizedFirstName, localizedLastName } = profileResponse.data;
    const { elements } = emailResponse.data;
    const email = elements[0]['handle~'].emailAddress;

    let linkedinUser = await LinkedInUser.findOne({ linkedinId: id, userId: oauthData.userId });

    if (!linkedinUser) {
      linkedinUser = new LinkedInUser({
        userId: oauthData.userId,
        linkedinId: id,
        accessToken: access_token,
        firstName: localizedFirstName,
        lastName: localizedLastName,
        email: email,
      });
      await linkedinUser.save();
    } else {
      linkedinUser.accessToken = access_token;
      await linkedinUser.save();
    }

    await OAuthDataLinkedin.deleteOne({ _id: oauthData._id });

    res.status(200).json({ message: 'LinkedIn account connected successfully' });
  } catch (error) {
    console.error('Error handling LinkedIn callback:', error);
    if (error.response && error.response.data && error.response.data.error_description) {
      res.status(error.response.status).json({ error: error.response.data.error_description });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = { linkedinAuth, linkedinCallback };
