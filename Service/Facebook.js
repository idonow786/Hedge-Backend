// services/facebook.js
const axios = require('axios');
const { FacebookUser } = require('../Model/Facebook');
const { uploadImageToFirebase } = require('../Firebase/uploadImage');
const { uploadVideoToFirebase } = require('../Firebase/uploadVideo');

const GRAPH_API_VERSION = 'v20.0';

const postToFacebook = async (adminId, pageId, title, description, mediaFiles) => {
  const facebookUser = await FacebookUser.findOne({ adminId });
  if (!facebookUser) {
    throw new Error('Facebook user not found');
  }

  const facebookAccessToken = facebookUser.accessToken;
  const facebookPostUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/feed?access_token=${facebookAccessToken}`;

  // Upload images to Firebase Storage if any
  const imageUrls = await Promise.all(
    mediaFiles.filter(file => file.mimetype.startsWith('image/')).map(async (file) => {
      const imageUrl = await uploadImageToFirebase(file.buffer.toString('base64'), file.mimetype);
      return imageUrl;
    })
  );

  // Upload videos to Firebase Storage if any
  const videoUrls = await Promise.all(
    mediaFiles.filter(file => file.mimetype.startsWith('video/')).map(async (file) => {
      const videoUrl = await uploadVideoToFirebase(file);
      return videoUrl;
    })
  );

  const facebookPostData = {
    message: description,
    link: '',
    name: title,
    attached_media: [
      ...imageUrls.map(url => ({ media_fbid: url })),
      ...videoUrls.map(url => ({ media_fbid: url }))
    ]
  };

  const response = await axios.post(facebookPostUrl, facebookPostData);
  return response.data.id;
};

const deleteFromFacebook = async (adminId, pageId, postId) => {
  const facebookUser = await FacebookUser.findOne({ adminId });
  if (!facebookUser) {
    throw new Error('Facebook user not found');
  }

  const facebookAccessToken = facebookUser.accessToken;
  const facebookDeleteUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}_${postId}?access_token=${facebookAccessToken}`;

  await axios.delete(facebookDeleteUrl);
};

const updateFacebookPost = async (adminId, pageId, postId, title, description, mediaFiles) => {
  const facebookUser = await FacebookUser.findOne({ adminId });
  if (!facebookUser) {
    throw new Error('Facebook user not found');
  }

  const facebookAccessToken = facebookUser.accessToken;
  const facebookUpdateUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}_${postId}?access_token=${facebookAccessToken}`;

  // Upload images to Firebase Storage if any
  const imageUrls = await Promise.all(
    mediaFiles.filter(file => file.mimetype.startsWith('image/')).map(async (file) => {
      const imageUrl = await uploadImageToFirebase(file.buffer.toString('base64'), file.mimetype);
      return imageUrl;
    })
  );

  // Upload videos to Firebase Storage if any
  const videoUrls = await Promise.all(
    mediaFiles.filter(file => file.mimetype.startsWith('video/')).map(async (file) => {
      const videoUrl = await uploadVideoToFirebase(file);
      return videoUrl;
    })
  );

  const facebookUpdateData = {
    message: description,
    link: '',
    name: title,
    attached_media: [
      ...imageUrls.map(url => ({ media_fbid: url })),
      ...videoUrls.map(url => ({ media_fbid: url }))
    ]
  };

  await axios.post(facebookUpdateUrl, facebookUpdateData);
};




FacebookPages = async (adminId) => {
  const facebookUser = await FacebookUser.findOne({ adminId });
  if (!facebookUser) {
    throw new Error('Facebook user not found');
  }

  const facebookAccessToken = facebookUser.accessToken;
  const facebookPagesUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?access_token=${facebookAccessToken}`;

  const response = await axios.get(facebookPagesUrl);
  return response.data.data;
};


module.exports = {
  FacebookPages,
  postToFacebook,
  deleteFromFacebook,
  updateFacebookPost,
};