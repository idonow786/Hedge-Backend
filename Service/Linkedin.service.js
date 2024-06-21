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
  const linkedInPostUrl = `https://api.linkedin.com/v2/shares`;

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

  const content = {
    title: title,
    description: description,
    media: [
      ...imageUrls.map(url => ({ media: url })),
      ...videoUrls.map(url => ({ media: url }))
    ]
  };

  const linkedInPostData = {
    owner: `urn:li:person:${linkedInUser.linkedinId}`,
    text: {
      text: description
    },
    content: content,
    distribution: {
      linkedInDistributionTarget: {}
    }
  };

  const response = await axios.post(linkedInPostUrl, linkedInPostData, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
};

module.exports = { postToLinkedIn };
