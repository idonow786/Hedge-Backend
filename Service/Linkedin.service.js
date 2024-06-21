// services/linkedin.js
const axios = require('axios');
const { LinkedInUser } = require('../Model/Linkedin');
const { uploadImageToFirebase } = require('../Firebase/uploadImage');
const { uploadVideoToFirebase } = require('../Firebase/uploadVideo');

const postToLinkedIn = async (adminId, title, description, mediaFiles) => {
  const linkedInUser = await LinkedInUser.findOne({ adminId });
  if (!linkedInUser) {
    throw new Error('LinkedIn user not found');
  }

  const linkedInAccessToken = linkedInUser.accessToken;
  const linkedInPostUrl = `https://api.linkedin.com/v2/ugcPosts`;

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

  const media = [
    ...imageUrls.map(url => ({
      status: 'READY',
      description: {
        text: title
      },
      originalUrl: url,
      mediaType: 'IMAGE'
    })),
    ...videoUrls.map(url => ({
      status: 'READY',
      description: {
        text: title
      },
      originalUrl: url,
      mediaType: 'VIDEO'
    }))
  ];

  const linkedInPostData = {
    author: `urn:li:person:${linkedInUser.linkedinId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: description
        },
        shareMediaCategory: 'IMAGE',
        media: media
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const response = await axios.post(linkedInPostUrl, linkedInPostData, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('LinkedIn response: ', response.data);
  return response.data.id;
};

module.exports = { postToLinkedIn };
