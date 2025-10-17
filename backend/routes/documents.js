const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Simple document routes that won't cause errors
router.get('/test', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Document routes are working!',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'
  });
});

// Basic upload endpoint that won't fail
router.post('/upload', auth, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Document upload not implemented yet'
  });
});

module.exports = router;