const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { videoUpload } = require('../config/cloudinary'); // CHANGED: from 'upload' to 'videoUpload'
const auth = require('../middleware/auth');

// Test connection
router.get('/test', auth, videoController.testConnection);

// Upload video
router.post('/upload', auth, videoUpload.single('video'), videoController.uploadVideo);

// Add video content
router.post('/content', auth, videoController.addVideoContent);

// Get course videos
router.get('/course/:courseId', auth, videoController.getCourseVideos);

// Delete video content
router.delete('/content/:contentId', auth, videoController.deleteVideoContent);

// Get upload signature
router.post('/signature', auth, videoController.getUploadSignature);

module.exports = router;