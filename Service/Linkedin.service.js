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

// Function to register media upload to LinkedIn
const registerMediaUpload = async (linkedInAccessToken, personURN, mediaType) => {
  const registerUploadUrl = 'https://api.linkedin.com/v2/assets?action=registerUpload';

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

  const response = await axios.post(registerUploadUrl, registerUploadData, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.value;
};

// Function to upload media to LinkedIn
const uploadMediaToLinkedIn = async (uploadUrl, mediaBuffer, mediaType) => {
  await axios.put(uploadUrl, mediaBuffer, {
    headers: {
      'Content-Type': mediaType.startsWith('image/') ? 'image/jpeg' : 'video/mp4'
    }
  });
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
  const personURN = `urn:li:person:${userDetails.id}`;

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

  // Register and upload media to LinkedIn and get URNs
  const media = [];
  for (const file of mediaFiles) {
    const mediaType = file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO';
    const { uploadMechanism, asset } = await registerMediaUpload(linkedInAccessToken, personURN, mediaType);
    await uploadMediaToLinkedIn(uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl, file.buffer, file.mimetype);
    media.push({
      status: 'READY',
      description: {
        text: title
      },
      media: asset,
      title: {
        text: title
      }
    });
  }

  // Create the LinkedIn post
  const postData = {
    author: personURN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: description
        },
        shareMediaCategory: media.length > 0 ? (media[0].media.includes('video') ? 'VIDEO' : 'IMAGE') : 'NONE',
        media: media.length > 0 ? media : undefined
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const response = await axios.post(linkedInPostUrl, postData, {
    headers: {
      'Authorization': `Bearer ${linkedInAccessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.id;
};

module.exports = {
  postToLinkedIn
};
