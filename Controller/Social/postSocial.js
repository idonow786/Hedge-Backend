const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();
const getSocial = async (req, res) => {
  try {
    const response = await axios.get('https://app.ayrshare.com/api/profiles', {
      headers: {
        'Authorization': `Bearer ${process.env.SOCIAL_KEY}`
      }
    });

    const profiles = response.data;
    res.json(profiles);
  } catch (error) {
    console.error('Error retrieving social profiles:', error);
    res.status(500).json({ error: 'Failed to retrieve social profiles' });
  }
};




const postSocial = async (req, res) => {
  try {
    const { description } = req.body;
    const image = req.file;

    const response = await axios.get('https://app.ayrshare.com/api/profiles', {
      headers: {
        'Authorization': `Bearer ${process.env.SOCIAL_KEY}`
      }
    });

    const profiles = response.data;
    const profileKeys = profiles.map(profile => profile.profileKey);

    const form = new FormData();
    form.append('post', description);
    form.append('platforms', profileKeys);
    form.append('media', image.buffer, { filename: image.originalname });

    const postResponse = await axios.post('https://app.ayrshare.com/api/post', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.SOCIAL_KEY}`
      }
    });

    res.json(postResponse.data);
  } catch (error) {
    console.error('Error posting to social accounts:', error);
    res.status(500).json({ error: 'Failed to post to social accounts' });
  }
};

module.exports = { getSocial, postSocial };
