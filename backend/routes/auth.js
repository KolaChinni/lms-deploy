const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// ========== DEBUG MIDDLEWARE ==========
router.use((req, res, next) => {
  console.log(`🟡 Auth Route Called: ${req.method} ${req.originalUrl}`);
  next();
});

// ========== PUBLIC AUTH ROUTES (no auth required) ==========
router.post('/register', authController.register);
router.post('/login', authController.login);  // NO auth middleware here!
router.get('/health', authController.health);

// ========== TEST ROUTE ==========
router.get('/test', (req, res) => {
  console.log('✅ GET /api/auth/test - Working!');
  res.json({
    success: true,
    message: '🎉 Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// ========== PROTECTED ROUTES (require authentication) ==========
router.get('/profile', auth, authController.getProfile);
router.get('/me', auth, authController.getCurrentUser);
router.post('/verify-email', auth, authController.verifyEmail);

console.log('✅ Auth routes loaded with actual controllers');

module.exports = router;
