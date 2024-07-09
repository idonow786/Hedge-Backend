const Twit = require('twit');
const { TwitterUser } = require('../Model/Twitter');

const deleteTweet = async (twitterClient, tweetId) => {
  try {
    const response = await twitterClient.post(`statuses/destroy/${tweetId}`, {});
    return response.data;
  } catch (error) {
    console.error('Error deleting tweet:', error);
    throw new Error('Error deleting tweet');
  }
};

const uploadMediaToTwitter = async (twitterClient, mediaData, mediaType) => {
  try {
    const mediaUploadResponse = await twitterClient.post('media/upload', {
      media_data: mediaData,
      media_category: mediaType.startsWith('image/') ? 'tweet_image' : 'tweet_video'
    });

    return mediaUploadResponse.data.media_id_string;
  } catch (error) {
    console.error('Error uploading media to Twitter:', error);
    throw new Error('Error uploading media to Twitter');
  }
};

const postToTwitter = async (description, imageUrls, videoUrls, adminId) => {
  // Find the Twitter user by adminId
  const twitterUser = await TwitterUser.findOne({ adminId });
  if (!twitterUser) {
    throw new Error('Twitter user not found');
  }

  const twitterClient = new Twit({
    consumer_key: process.env.TIKTOK_CLIENT_KEY,
    consumer_secret: process.env.TIKTOK_CLIENT_SECRET,
    access_token: twitterUser.accessToken,
    access_token_secret: twitterUser.accessTokenSecret,
  });

  // Upload media to Twitter
  const mediaIds = await Promise.all([
    ...imageUrls.map(async (url) => {
      const mediaData = url.split(',')[1]; // Assuming base64 data URL
      return await uploadMediaToTwitter(twitterClient, mediaData, 'image/jpeg');
    }),
    ...videoUrls.map(async (url) => {
      const mediaData = url.split(',')[1]; // Assuming base64 data URL
      return await uploadMediaToTwitter(twitterClient, mediaData, 'video/mp4');
    })
  ]);

  const tweetText = description.slice(0, 255);

  try {
    const response = await twitterClient.post('statuses/update', {
      status: tweetText,
      media_ids: mediaIds.join(',')
    });

    return response.data;
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    throw new Error('Error posting to Twitter');
  }
};

module.exports = {
  deleteTweet,
  postToTwitter
};
