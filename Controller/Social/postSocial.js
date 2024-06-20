const { FacebookUser } = require('../../Model/Facebook');
const { LinkedInUser } = require('../../Model/Linkedin');
const { TwitterUser } = require('../../Model/Twitter');
const Posts = require('../../Model/Posts');
const axios = require('axios');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const { uploadVideoToFirebase } = require('../../Firebase/uploadVideo');
const facebookService = require('../../Service/Facebook.service');








exports.getFacebookPages = async (req, res) => {
  try {
    const adminId = req.adminId;
    const pages = await facebookService.FacebookPages(adminId);
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.createPost = async (req, res) => {
  try {
    const { title, description, facebook, pageId,linkedin } = req.body;
    const adminId = req.adminId;

    // Upload images to Firebase Storage
    const imageUrls = await Promise.all(
      req.files.filter(file => file.mimetype.startsWith('image/')).map(async (file) => {
        const imageUrl = await uploadImageToFirebase(file.buffer.toString('base64'), file.mimetype);
        return imageUrl;
      })
    );

    // Upload videos to Firebase Storage
    const videoUrls = await Promise.all(
      req.files.filter(file => file.mimetype.startsWith('video/')).map(async (file) => {
        const videoUrl = await uploadVideoToFirebase(file);
        return videoUrl;
      })
    );

    // Create a new post
    const post = new Posts({
      PostTitle: title,
      PostPics: [...imageUrls, ...videoUrls],
      PostDescription: description,
      AdminID: adminId,
    });

    await post.save();

    // Get user details from the models based on adminId
    const facebookUser = await FacebookUser.findOne({ adminId });
    const linkedinUser = await LinkedInUser.findOne({ adminId });
    const twitterUser = await TwitterUser.findOne({ adminId });


    // Post on Facebook if requested
    // if (facebook && pageId) {
    //   const facebookPostId = await facebookService.postToFacebook(adminId, pageId, title, description, req.files);
    //   post.FacebookPostId = facebookPostId;
    // }
    // Post on LinkedIn
    if (linkedin) {
      const mediaFiles = req.files; 
  try {
    const result = await postToLinkedIn(adminId, title, description, mediaFiles);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
    }

    // Post on Twitter
    if (twitterUser) {
      const twitterAccessToken = twitterUser.accessToken;
      const twitterAccessTokenSecret = twitterUser.accessTokenSecret;
      const twitterPostUrl = 'https://api.twitter.com/2/tweets';
      const twitterPostData = {
        text: description.slice(0, 280), // Truncate the description to fit Twitter's character limit
      };
      const twitterResponse = await axios.post(twitterPostUrl, twitterPostData, {
        headers: {
          Authorization: `Bearer ${twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      post.TwitterPostId = twitterResponse.data.data.id;
    }

    await post.save();

    res.status(201).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const adminId = req.adminId;
    const posts = await Posts.find({ AdminID: adminId });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const { title, description } = req.body;
    const adminId = req.adminId;

    const post = await Posts.findOne({ _id: postId, AdminID: adminId });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.PostTitle = title;
    post.PostDescription = description;

    await post.save();

    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const adminId = req.adminId;

    const post = await Posts.findOne({ _id: postId, AdminID: adminId });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete post from Facebook
    if (post.FacebookPostId) {
      const facebookUser = await FacebookUser.findOne({ adminId });
      if (facebookUser) {
        const facebookAccessToken = facebookUser.accessToken;
        const facebookDeleteUrl = `https://graph.facebook.com/${post.FacebookPostId}?access_token=${facebookAccessToken}`;
        await axios.delete(facebookDeleteUrl);
      }
    }

    // Delete post from LinkedIn
    if (post.LinkedInPostId) {
      const linkedinUser = await LinkedInUser.findOne({ adminId });
      if (linkedinUser) {
        const linkedinAccessToken = linkedinUser.accessToken;
        const linkedinDeleteUrl = `https://api.linkedin.com/v2/ugcPosts/${post.LinkedInPostId}`;
        await axios.delete(linkedinDeleteUrl, {
          headers: {
            Authorization: `Bearer ${linkedinAccessToken}`,
          },
        });
      }
    }

    // Delete post from Twitter
    if (post.TwitterPostId) {
      const twitterUser = await TwitterUser.findOne({ adminId });
      if (twitterUser) {
        const twitterAccessToken = twitterUser.accessToken;
        const twitterAccessTokenSecret = twitterUser.accessTokenSecret;
        const twitterDeleteUrl = `https://api.twitter.com/2/tweets/${post.TwitterPostId}`;
        await axios.delete(twitterDeleteUrl, {
          headers: {
            Authorization: `Bearer ${twitterAccessToken}`,
          },
        });
      }
    }

    await post.remove();

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

