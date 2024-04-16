const FacebookUser = require('../../Model/Facebook');


const AuthFacebook= (req, res) => {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = 'http://localhost:3000/auth/facebook/callback';
    const scope = ['email', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'].join(',');
    const authUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Facebook authentication link:', error);
    res.status(500).json({ error: 'An error occurred while generating the Facebook authentication link' });
  }
};

const facebookAuthCallback= async (req, res) => {
  try {
    const {  facebookId, accessToken, name, email } = req.body;
    const adminId = req.adminId
    const existingUser = await FacebookUser.findOne({ facebookId });

    if (existingUser) {
      existingUser.accessToken = accessToken;
      await existingUser.save();
      res.json({ message: 'User details updated successfully' });
    } else {
      const newUser = new FacebookUser({
        userId:adminId,
        facebookId,
        accessToken,
        name,
        email
      });
      await newUser.save();
      res.json({ message: 'User details saved successfully' });
    }
  } catch (error) {
    console.error('Error handling user details:', error);
    res.status(500).json({ error: 'An error occurred while handling user details' });
  }
};

module.exports = {facebookAuthCallback,AuthFacebook};