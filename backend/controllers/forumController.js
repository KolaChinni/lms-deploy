const Forum = require('../models/Forum');

// Course Forum
exports.getCourseForum = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const categories = await Forum.getCategoriesByCourse(courseId);
    
    // Ensure default categories exist
    if (categories.length === 0) {
      await Forum.ensureDefaultCategory(courseId);
      const updatedCategories = await Forum.getCategoriesByCourse(courseId);
      return res.json({
        success: true,
        message: 'Course forum retrieved successfully',
        data: { categories: updatedCategories }
      });
    }

    res.json({
      success: true,
      message: 'Course forum retrieved successfully',
      data: { categories }
    });
  } catch (error) {
    console.error('Get course forum error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course forum',
      error: error.message
    });
  }
};

// Threads
exports.getThreadsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const threads = await Forum.getThreadsByCategory(categoryId, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      message: 'Threads retrieved successfully',
      data: { threads }
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve threads',
      error: error.message
    });
  }
};

exports.createThread = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { title, content } = req.body;
    const author_id = req.userId;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const thread = await Forum.createThread({
      category_id: categoryId,
      author_id,
      title,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Thread created successfully',
      data: { thread }
    });
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create thread',
      error: error.message
    });
  }
};

exports.getThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    
    const thread = await Forum.getThreadById(threadId);
    
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    const posts = await Forum.getPostsByThread(threadId);
    
    // Get replies for each post
    const postsWithReplies = await Promise.all(
      posts.map(async (post) => {
        const replies = await Forum.getRepliesToPost(post.id);
        return { ...post, replies };
      })
    );

    res.json({
      success: true,
      message: 'Thread retrieved successfully',
      data: { thread, posts: postsWithReplies }
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve thread',
      error: error.message
    });
  }
};

// Posts (Replies)
exports.createPost = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, parent_id = null } = req.body;
    const author_id = req.userId;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const post = await Forum.createPost({
      thread_id: threadId,
      author_id,
      content,
      parent_id
    });

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message
    });
  }
};

// Reactions
exports.addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reaction_type } = req.body;
    const user_id = req.userId;

    const result = await Forum.addReaction({
      post_id: postId,
      user_id,
      reaction_type
    });

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: result
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
};

exports.removeReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const user_id = req.userId;

    const result = await Forum.removeReaction(postId, user_id);

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: result
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: error.message
    });
  }
};

// Search
exports.searchThreads = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const threads = await Forum.searchThreads(courseId, q);

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: { threads }
    });
  } catch (error) {
    console.error('Search threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search threads',
      error: error.message
    });
  }
};

// Teacher actions
exports.pinThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { pinned = true } = req.body;

    const result = await Forum.pinThread(threadId, pinned);

    res.json({
      success: true,
      message: `Thread ${pinned ? 'pinned' : 'unpinned'} successfully`,
      data: result
    });
  } catch (error) {
    console.error('Pin thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin thread',
      error: error.message
    });
  }
};

exports.lockThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { locked = true } = req.body;

    const result = await Forum.lockThread(threadId, locked);

    res.json({
      success: true,
      message: `Thread ${locked ? 'locked' : 'unlocked'} successfully`,
      data: result
    });
  } catch (error) {
    console.error('Lock thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock thread',
      error: error.message
    });
  }
};

exports.markAsAnswer = async (req, res) => {
  try {
    const { postId } = req.params;
    const { is_answer = true } = req.body;

    const result = await Forum.markAsAnswer(postId, is_answer);

    res.json({
      success: true,
      message: `Post ${is_answer ? 'marked as answer' : 'unmarked as answer'} successfully`,
      data: result
    });
  } catch (error) {
    console.error('Mark as answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as answer',
      error: error.message
    });
  }
};