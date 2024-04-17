// twitterController.js
const { TwitterApi } = require('twitter-api-v2');
const { Twitter, OAuthData } = require('../../Model/Twitter');

const getAuthUrl = async (req, res) => {
  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const { url, codeVerifier, state } = await client.generateOAuth2AuthLink(
      process.env.TWITTER_CALLBACK_URL,
      { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );

    await OAuthData.create({
      state,
      codeVerifier,
    });

    res.json({ url });
  } catch (error) {
    console.error('Error generating Twitter auth URL:', error);
    res.status(500).json({ error: 'Failed to generate Twitter auth URL' });
  }
};

const handleCallback = async (req, res) => {
  try {
    const { state, code } = req.query;

    const oauthData = await OAuthData.findOne({ state });

    if (!oauthData) {
      console.error('Invalid OAuth data');
      return res.status(400).json({ error: 'Invalid OAuth data' });
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const {
      client: loggedClient,
      accessToken,
      refreshToken,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier: oauthData.codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL,
    });

    const { data } = await loggedClient.v2.me();

    let twitter = await Twitter.findOne({ twitterId: data.id });

    if (!twitter) {
      twitter = new Twitter({
        userId: req.user._id,
        twitterId: data.id,
        accessToken,
        refreshToken,
      });
      await twitter.save();
    } else {
      twitter.accessToken = accessToken;
      twitter.refreshToken = refreshToken;
      await twitter.save();
    }

    await OAuthData.deleteOne({ _id: oauthData._id });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error handling Twitter callback:', error);
    res.status(500).json({ error: 'Failed to handle Twitter callback' });
  }
};

const postTweet = async (req, res) => {
  try {
    const { text, imageUrl } = req.body;

    const twitter = await Twitter.findOne({ userId: req.user._id });

    if (!twitter) {
      return res.status(400).json({ error: 'Twitter account not connected' });
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      accessToken: twitter.accessToken,
      refreshToken: twitter.refreshToken,
    });

    let mediaId;
    if (imageUrl) {
      const { data } = await client.v1.uploadMedia(imageUrl);
      mediaId = data.media_id_string;
    }

    await client.v2.tweet({
      text,
      media: { media_ids: mediaId ? [mediaId] : [] },
    });

    res.json({ message: 'Tweet posted successfully' });
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).json({ error: 'Failed to post tweet' });
  }
};


module.exports = {
  getAuthUrl,
  handleCallback,
  postTweet,
};
