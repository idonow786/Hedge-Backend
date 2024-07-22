const admin = require('./config');
const { v4: uuidv4 } = require('uuid');

const bucket = admin.storage().bucket();

async function uploadFileToFirebase(fileBuffer, originalname) {
    try {
      const filename = `documents/${uuidv4()}-${originalname}`;
  
      const file = bucket.file(filename);
  
      await file.save(fileBuffer, {
        metadata: {
          contentType: 'application/octet-stream', 
        },
      });
  
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', 
      });
  
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }
  module.exports={uploadFileToFirebase}