const { executeQuery } = require('../config/database');

class Blog {
  static async create(blogData) {
    try {
      const { title, content, author_id, featured_image, tags, read_time } = blogData;
      
      const result = await executeQuery(
        `INSERT INTO blogs (title, content, author_id, featured_image, tags, read_time) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, content, author_id, featured_image, JSON.stringify(tags || []), read_time || 5]
      );

      return { 
        id: result.insertId,
        ...blogData,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Blog creation error:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const rows = await executeQuery(`
        SELECT 
          b.*,
          u.name as author_name,
          u.email as author_email
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        WHERE b.is_published = TRUE
        ORDER BY b.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Find all blogs error:', error);
      throw error;
    }
  }

  static async findById(blogId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          b.*,
          u.name as author_name,
          u.email as author_email
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        WHERE b.id = ?
      `, [blogId]);
      
      return rows[0] || null;
    } catch (error) {
      console.error('Find blog by ID error:', error);
      throw error;
    }
  }

  static async findByAuthor(authorId) {
    try {
      const rows = await executeQuery(`
        SELECT * FROM blogs 
        WHERE author_id = ?
        ORDER BY created_at DESC
      `, [authorId]);
      return rows;
    } catch (error) {
      console.error('Find blogs by author error:', error);
      throw error;
    }
  }
}

module.exports = Blog;