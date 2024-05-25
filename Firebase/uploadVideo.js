const admin = require('./config');
const { v4: uuidv4 } = require('uuid');

const bucket = admin.storage().bucket();

async function uploadVideoToFirebase(videoFile) {
  try {
    const filename = `videos/${uuidv4()}.${videoFile.originalname.split('.').pop()}`;

    const file = bucket.file(filename);

    await file.save(videoFile.buffer, {
      metadata: {
        contentType: videoFile.mimetype,
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    return url;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Failed to upload video');
  }
}

module.exports = { uploadVideoToFirebase };