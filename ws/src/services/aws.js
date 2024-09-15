const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const IAM_USER_KEY = process.env.IAM_USER_KEY;
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
  },
});

module.exports = {
  uploadToS3: async function (file, filename) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
      };
      const command = new PutObjectCommand(params);
      const data = await s3Client.send(command);
      console.log(data);
      return { error: false, message: data };
    } catch (err) {
      console.log(err);
      return { error: true, message: err.message };
    }
  },

  deleteFileS3: async function (key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };
      const command = new DeleteObjectCommand(params);
      const data = await s3Client.send(command);
      console.log(data);
      return { error: false, message: data };
    } catch (err) {
      console.log(err);
      return { error: true, message: err.message };
    }
  },
};