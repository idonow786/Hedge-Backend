const { Ads } = require('../../Model/Ads');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');
const { uploadVideoToFirebase } = require('../../Firebase/uploadVideo');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// Controller to add a new ad
const addAd = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to add bus owners' });
    }

    const { AdsLink } = req.body;
    let picLink = '';
    let videoLink = '';
    if (req.files && req.files.pic) {
      const base64Image = req.files.pic[0].buffer.toString('base64');
      const contentType = req.files.pic[0].mimetype;
      picLink = await uploadImageToFirebase(base64Image, contentType);
    }

    if (req.files && req.files.video) {
      const videoFile = req.files.video[0];
      videoLink = await uploadVideoToFirebase(videoFile);
    }

    const newAd = new Ads({
      AdsLink,
      picLink,
      videoLink,
      clickCount: 0,
    });

    await newAd.save();

    res.status(201).json({ message: 'Ad added successfully', ad: newAd });
  } catch (error) {
    console.error('Error adding ad:', error);
    res.status(500).json({ error: 'Failed to add ad' });
  }
};

// Controller to update an ad using its ID
const updateAd = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to add bus owners' });
    }

    const { id } = req.body;
    const { AdsLink } = req.body;
    let picLink = '';
    let videoLink = '';

    if (req.files && req.files.pic) {
      const base64Image = req.files.pic[0].buffer.toString('base64');
      const contentType = req.files.pic[0].mimetype;
      picLink = await uploadImageToFirebase(base64Image, contentType);
    }

    if (req.files && req.files.video) {
      const videoFile = req.files.video[0];
      videoLink = await uploadVideoToFirebase(videoFile);
    }

    const updatedAd = await Ads.findByIdAndUpdate(
      id,
      {
        AdsLink,
        picLink: picLink || undefined,
        videoLink: videoLink || undefined,
      },
      { new: true }
    );

    if (!updatedAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ message: 'Ad updated successfully', ad: updatedAd });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
};

// Controller to delete an ad using its ID
const deleteAd = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You are not authorized to add bus owners' });
    }
    const { id } = req.body;

    const deletedAd = await Ads.findByIdAndDelete(id);

    if (!deletedAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
};

// Controller to get an ad using its ID
const getAdById = async (req, res) => {
  try {

    const ad = await Ads.find();

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json({ ad });
  } catch (error) {
    console.error('Error getting ad:', error);
    res.status(500).json({ error: 'Failed to get ad' });
  }
};

// Controller to increment the click count of an ad
const incrementClickCount = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'You are not authorized to add bus owners' });
    }
    const { id } = req.body;

    const ad = await Ads.findById(id);

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    ad.clickCount = (parseInt(ad.clickCount) || 0) + 1;
    await ad.save();

    res.json({ message: 'Click count incremented successfully', ad });
  } catch (error) {
    console.error('Error incrementing click count:', error);
    res.status(500).json({ error: 'Failed to increment click count' });
  }
};

module.exports={deleteAd,addAd,incrementClickCount,getAdById,updateAd}