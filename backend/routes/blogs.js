const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const auth = require('../middleware/auth');

// Get all published blogs
router.get('/', blogController.getAllBlogs);

// Get single blog
router.get('/:id', blogController.getBlogById);

// Create blog (teachers/admins only)
router.post('/', auth, blogController.createBlog);

// Get my blogs
router.get('/author/my-blogs', auth, blogController.getMyBlogs);

module.exports = router;