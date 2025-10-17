const Blog = require('../models/Blog');

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll();
    res.json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: { blogs }
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blogs',
      error: error.message
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog retrieved successfully',
      data: { blog }
    });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blog',
      error: error.message
    });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, featured_image, tags, read_time } = req.body;
    const author_id = req.userId;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const blog = await Blog.create({
      title,
      content,
      author_id,
      featured_image,
      tags,
      read_time
    });

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: { blog }
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    const author_id = req.userId;
    const blogs = await Blog.findByAuthor(author_id);
    
    res.json({
      success: true,
      message: 'Your blogs retrieved successfully',
      data: { blogs }
    });
  } catch (error) {
    console.error('Get my blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your blogs',
      error: error.message
    });
  }
};