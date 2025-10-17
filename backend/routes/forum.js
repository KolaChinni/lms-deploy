const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const auth = require('../middleware/auth');

// Course forum
router.get('/course/:courseId', auth, forumController.getCourseForum);

// Threads
router.get('/category/:categoryId/threads', auth, forumController.getThreadsByCategory);
router.post('/category/:categoryId/threads', auth, forumController.createThread);
router.get('/thread/:threadId', auth, forumController.getThread);

// Posts (replies)
router.post('/thread/:threadId/posts', auth, forumController.createPost);

// Reactions
router.post('/post/:postId/reactions', auth, forumController.addReaction);
router.delete('/post/:postId/reactions', auth, forumController.removeReaction);

// Search
router.get('/course/:courseId/search', auth, forumController.searchThreads);

// Teacher actions
router.patch('/thread/:threadId/pin', auth, forumController.pinThread);
router.patch('/thread/:threadId/lock', auth, forumController.lockThread);
router.patch('/post/:postId/answer', auth, forumController.markAsAnswer);

module.exports = router;