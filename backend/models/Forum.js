const { executeQuery } = require('../config/database');

class Forum {
  // Category methods
  static async createCategory(courseId, title, description = '') {
    try {
      const result = await executeQuery(
        `INSERT INTO forum_categories (course_id, title, description) VALUES (?, ?, ?)`,
        [courseId, title, description]
      );

      return { 
        id: result.insertId,
        course_id: courseId,
        title,
        description,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  static async getCategoriesByCourse(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          fc.*,
          COUNT(ft.id) as thread_count,
          (SELECT COUNT(*) FROM forum_posts fp 
           JOIN forum_threads ft2 ON fp.thread_id = ft2.id 
           WHERE ft2.category_id = fc.id) as post_count,
          (SELECT MAX(ft.last_reply_at) FROM forum_threads ft 
           WHERE ft.category_id = fc.id) as last_activity
        FROM forum_categories fc
        LEFT JOIN forum_threads ft ON fc.id = ft.category_id
        WHERE fc.course_id = ?
        GROUP BY fc.id
        ORDER BY fc.created_at ASC
      `, [courseId]);
      
      return rows;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  // Thread methods
  static async createThread(threadData) {
    try {
      const { category_id, author_id, title, content } = threadData;
      
      const result = await executeQuery(
        `INSERT INTO forum_threads (category_id, author_id, title, content) VALUES (?, ?, ?, ?)`,
        [category_id, author_id, title, content]
      );

      // Create default category for course if it doesn't exist
      await this.ensureDefaultCategory(category_id);

      return { 
        id: result.insertId,
        ...threadData,
        view_count: 0,
        reply_count: 0,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Create thread error:', error);
      throw error;
    }
  }

  static async ensureDefaultCategory(courseId) {
    try {
      // Check if course has any categories
      const categories = await this.getCategoriesByCourse(courseId);
      if (categories.length === 0) {
        // Create default categories
        const defaultCategories = [
          { title: 'General Discussion', description: 'General course discussions and questions' },
          { title: 'Course Questions', description: 'Questions about course content and materials' },
          { title: 'Assignments Help', description: 'Discussion about assignments and projects' }
        ];

        for (const category of defaultCategories) {
          await this.createCategory(courseId, category.title, category.description);
        }
      }
    } catch (error) {
      console.error('Ensure default category error:', error);
    }
  }

  static async getThreadsByCategory(categoryId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const rows = await executeQuery(`
        SELECT 
          ft.*,
          u.name as author_name,
          u.role as author_role,
          (SELECT COUNT(*) FROM forum_posts fp WHERE fp.thread_id = ft.id) as total_replies,
          (SELECT u2.name FROM forum_posts fp2 
           JOIN users u2 ON fp2.author_id = u2.id 
           WHERE fp2.thread_id = ft.id 
           ORDER BY fp2.created_at DESC LIMIT 1) as last_reply_author,
          (SELECT MAX(fp2.created_at) FROM forum_posts fp2 
           WHERE fp2.thread_id = ft.id) as last_reply_date
        FROM forum_threads ft
        JOIN users u ON ft.author_id = u.id
        WHERE ft.category_id = ?
        ORDER BY ft.is_pinned DESC, ft.last_reply_at DESC
        LIMIT ? OFFSET ?
      `, [categoryId, limit, offset]);
      
      return rows;
    } catch (error) {
      console.error('Get threads error:', error);
      throw error;
    }
  }

  static async getThreadById(threadId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          ft.*,
          u.name as author_name,
          u.role as author_role,
          fc.title as category_title,
          fc.course_id
        FROM forum_threads ft
        JOIN users u ON ft.author_id = u.id
        JOIN forum_categories fc ON ft.category_id = fc.id
        WHERE ft.id = ?
      `, [threadId]);
      
      if (rows.length === 0) return null;
      
      // Increment view count
      await executeQuery(
        `UPDATE forum_threads SET view_count = view_count + 1 WHERE id = ?`,
        [threadId]
      );
      
      return rows[0];
    } catch (error) {
      console.error('Get thread error:', error);
      throw error;
    }
  }

  // Post methods (replies)
  static async createPost(postData) {
    try {
      const { thread_id, author_id, content, parent_id = null } = postData;
      
      const result = await executeQuery(
        `INSERT INTO forum_posts (thread_id, author_id, content, parent_id) VALUES (?, ?, ?, ?)`,
        [thread_id, author_id, content, parent_id]
      );

      // Update thread reply count and last reply time
      await executeQuery(`
        UPDATE forum_threads 
        SET reply_count = reply_count + 1, last_reply_at = NOW() 
        WHERE id = ?
      `, [thread_id]);

      return { 
        id: result.insertId,
        ...postData,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  static async getPostsByThread(threadId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          fp.*,
          u.name as author_name,
          u.role as author_role,
          (SELECT COUNT(*) FROM forum_reactions fr WHERE fr.post_id = fp.id) as reaction_count,
          (SELECT COUNT(*) FROM forum_posts fp2 WHERE fp2.parent_id = fp.id) as reply_count
        FROM forum_posts fp
        JOIN users u ON fp.author_id = u.id
        WHERE fp.thread_id = ? AND fp.parent_id IS NULL
        ORDER BY fp.created_at ASC
      `, [threadId]);
      
      return rows;
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  }

  static async getRepliesToPost(postId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          fp.*,
          u.name as author_name,
          u.role as author_role
        FROM forum_posts fp
        JOIN users u ON fp.author_id = u.id
        WHERE fp.parent_id = ?
        ORDER BY fp.created_at ASC
      `, [postId]);
      
      return rows;
    } catch (error) {
      console.error('Get replies error:', error);
      throw error;
    }
  }

  // Reaction methods
  static async addReaction(reactionData) {
    try {
      const { post_id, user_id, reaction_type } = reactionData;
      
      const result = await executeQuery(`
        INSERT INTO forum_reactions (post_id, user_id, reaction_type) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type)
      `, [post_id, user_id, reaction_type]);

      return { success: true };
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  }

  static async removeReaction(postId, userId) {
    try {
      await executeQuery(
        `DELETE FROM forum_reactions WHERE post_id = ? AND user_id = ?`,
        [postId, userId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Remove reaction error:', error);
      throw error;
    }
  }

  static async getReactionsByPost(postId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          fr.*,
          u.name as user_name
        FROM forum_reactions fr
        JOIN users u ON fr.user_id = u.id
        WHERE fr.post_id = ?
      `, [postId]);
      
      return rows;
    } catch (error) {
      console.error('Get reactions error:', error);
      throw error;
    }
  }

  // Search methods
  static async searchThreads(courseId, query) {
    try {
      const rows = await executeQuery(`
        SELECT 
          ft.*,
          u.name as author_name,
          fc.title as category_title
        FROM forum_threads ft
        JOIN users u ON ft.author_id = u.id
        JOIN forum_categories fc ON ft.category_id = fc.id
        WHERE fc.course_id = ? AND (ft.title LIKE ? OR ft.content LIKE ?)
        ORDER BY ft.last_reply_at DESC
      `, [courseId, `%${query}%`, `%${query}%`]);
      
      return rows;
    } catch (error) {
      console.error('Search threads error:', error);
      throw error;
    }
  }

  // Teacher methods
  static async pinThread(threadId, pinned = true) {
    try {
      await executeQuery(
        `UPDATE forum_threads SET is_pinned = ? WHERE id = ?`,
        [pinned, threadId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Pin thread error:', error);
      throw error;
    }
  }

  static async lockThread(threadId, locked = true) {
    try {
      await executeQuery(
        `UPDATE forum_threads SET is_locked = ? WHERE id = ?`,
        [locked, threadId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Lock thread error:', error);
      throw error;
    }
  }

  static async markAsAnswer(postId, isAnswer = true) {
    try {
      await executeQuery(
        `UPDATE forum_posts SET is_answer = ? WHERE id = ?`,
        [isAnswer, postId]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Mark as answer error:', error);
      throw error;
    }
  }
}

module.exports = Forum;