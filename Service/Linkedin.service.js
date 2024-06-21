// services/linkedin.js
const axios = require('axios');
const { LinkedInUser } = require('../Model/Linkedin');
const { uploadImageToFirebase } = require('../Firebase/uploadImage');
const { uploadVideoToFirebase } = require('../Firebase/uploadVideo');

// Function to retrieve LinkedIn user details
const getLinkedInUserDetails = async (linkedInAccessToken) => {
  const userDetailsUrl = 'https://api.linkedin.com/v2/me';
  
  const response = await axios.get(userDetailsUrl, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`
    }
  });

  return response.data;
};

// Function to upload media to LinkedIn
const uploadMediaToLinkedIn = async (linkedInAccessToken, mediaUrl, mediaType, personURN) => {
  const uploadUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';

  const registerUploadData = {
    registerUploadRequest: {
      recipes: [`urn:li:digitalmediaRecipe:feedshare-${mediaType.toLowerCase()}`],
      owner: personURN,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }
      ]
    }
  };

  const registerUploadResponse = await axios.post(uploadUrl, registerUploadData, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const { uploadUrl: uploadDestination, asset } = registerUploadResponse.data.value;

  // Upload the media to LinkedIn's storage
  await axios.put(uploadDestination, mediaUrl, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': mediaType.startsWith('image/') ? 'image/jpeg' : 'video/mp4'
    }
  });

  return asset;
};

// Function to create a post on LinkedIn
const postToLinkedIn = async (adminId, title, description, mediaFiles) => {
  const linkedInUser = await LinkedInUser.findOne({ adminId });
  if (!linkedInUser) {
    throw new Error('LinkedIn user not found');
  }

  const linkedInAccessToken = linkedInUser.accessToken;

  // Retrieve LinkedIn user details
  const userDetails = await getLinkedInUserDetails(linkedInAccessToken);
  const personURN = `urn:li:person:${userDetails.sub}`;

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

  // Upload media to LinkedIn and get URNs
  const media = [];
  for (const url of [...imageUrls, ...videoUrls]) {
    const mediaType = url.includes('.mp4') ? 'VIDEO' : 'IMAGE';
    const asset = await uploadMediaToLinkedIn(linkedInAccessToken, url, mediaType, personURN);
    media.push({
      status: 'READY',
      description: {
        text: title
      },
      media: asset,
      mediaType: mediaType
    });
  }

  const linkedInPostData = {
    author: personURN,
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

  // Create the post on LinkedIn
  await axios.post(linkedInPostUrl, linkedInPostData, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': 'application/json'
    }
  });
};

module.exports = {
  postToLinkedIn
};
