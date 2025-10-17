const { executeQuery } = require('../config/database');

class CourseContent {
  static async create(contentData) {
    try {
      const { 
        course_id, 
        title, 
        description, 
        content_type, 
        video_url, 
        video_public_id, 
        video_duration, 
        document_url, 
        duration, 
        order_index,
        is_published = true 
      } = contentData;
      
      if (!course_id || !title) {
        throw new Error('Course ID and title are required');
      }

      // For video content, ensure we have video_url
      if (content_type === 'video' && !video_url) {
        throw new Error('Video URL is required for video content');
      }

      const result = await executeQuery(
        `INSERT INTO course_content 
         (course_id, title, description, content_type, video_url, video_public_id, video_duration, document_url, duration, display_order, is_published) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          course_id, 
          title.trim(), 
          description?.trim(), 
          content_type, 
          video_url, 
          video_public_id, 
          video_duration, 
          document_url, 
          duration, 
          order_index || 0,
          is_published
        ]
      );

      console.log('Course content created with ID:', result[0].id);

      return { 
        id: result[0].id,
        course_id,
        title: title.trim(),
        description: description?.trim(),
        content_type,
        video_url,
        video_public_id,
        video_duration,
        document_url,
        duration,
        order_index: order_index || 0,
        is_published,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Course content creation error:', error);
      throw error;
    }
  }

  static async findByCourseId(courseId) {
    try {
      console.log('🔍 Searching for course content with courseId:', courseId, 'Type:', typeof courseId);
      
      const rows = await executeQuery(`
        SELECT 
          id,
          course_id,
          title,
          description,
          content_type,
          video_url,
          video_public_id,
          video_duration,
          document_url,
          duration,
          display_order as order_index,
          is_published,
          created_at,
          updated_at
        FROM course_content 
        WHERE course_id = $1
        ORDER BY display_order ASC, created_at ASC
      `, [courseId]);
      
      console.log(`Found ${rows.length} content items for course ${courseId}`);
      console.log('Raw SQL results:', rows);
      return rows;
    } catch (error) {
      console.error('Find course content error:', error);
      throw error;
    }
  }

  static async findPublishedByCourseId(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          id,
          course_id,
          title,
          description,
          content_type,
          video_url,
          video_public_id,
          video_duration,
          document_url,
          duration,
          display_order as order_index,
          is_published,
          created_at,
          updated_at
        FROM course_content 
        WHERE course_id = $1 AND is_published = TRUE
        ORDER BY display_order ASC, created_at ASC
      `, [courseId]);
      
      return rows;
    } catch (error) {
      console.error('Find published course content error:', error);
      throw error;
    }
  }

  static async findById(contentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          cc.*, 
          c.teacher_id, 
          c.title as course_title,
          cc.display_order as order_index
        FROM course_content cc
        JOIN courses c ON cc.course_id = c.id
        WHERE cc.id = $1
      `, [contentId]);
      
      const content = rows[0] || null;
      if (content) {
        console.log(`Found content ${contentId}:`, {
          id: content.id,
          title: content.title,
          type: content.content_type,
          hasVideo: !!content.video_url
        });
      }
      
      return content;
    } catch (error) {
      console.error('Find content by ID error:', error);
      throw error;
    }
  }

  static async update(contentId, updateData) {
    try {
      const { 
        title, 
        description, 
        content_type, 
        video_url, 
        video_public_id, 
        video_duration, 
        document_url, 
        duration, 
        order_index, 
        is_published 
      } = updateData;
      
      // Build dynamic update query based on provided fields
      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        updateFields.push('title = $' + (updateValues.length + 1));
        updateValues.push(title.trim());
      }
      if (description !== undefined) {
        updateFields.push('description = $' + (updateValues.length + 1));
        updateValues.push(description?.trim());
      }
      if (content_type !== undefined) {
        updateFields.push('content_type = $' + (updateValues.length + 1));
        updateValues.push(content_type);
      }
      if (video_url !== undefined) {
        updateFields.push('video_url = $' + (updateValues.length + 1));
        updateValues.push(video_url);
      }
      if (video_public_id !== undefined) {
        updateFields.push('video_public_id = $' + (updateValues.length + 1));
        updateValues.push(video_public_id);
      }
      if (video_duration !== undefined) {
        updateFields.push('video_duration = $' + (updateValues.length + 1));
        updateValues.push(video_duration);
      }
      if (document_url !== undefined) {
        updateFields.push('document_url = $' + (updateValues.length + 1));
        updateValues.push(document_url);
      }
      if (duration !== undefined) {
        updateFields.push('duration = $' + (updateValues.length + 1));
        updateValues.push(duration);
      }
      if (order_index !== undefined) {
        updateFields.push('display_order = $' + (updateValues.length + 1));
        updateValues.push(order_index);
      }
      if (is_published !== undefined) {
        updateFields.push('is_published = $' + (updateValues.length + 1));
        updateValues.push(is_published);
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(contentId);

      const query = `UPDATE course_content SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`;
      
      const result = await executeQuery(query, updateValues);

      console.log(`Updated content ${contentId}:`, {
        rowCount: result.rowCount,
        updatedFields: updateFields
      });

      return result.rowCount > 0;
    } catch (error) {
      console.error('Course content update error:', error);
      throw error;
    }
  }

  static async delete(contentId) {
    try {
      // First get the content to check if it has a video with public_id
      const content = await this.findById(contentId);
      
      const result = await executeQuery(
        'DELETE FROM course_content WHERE id = $1',
        [contentId]
      );

      console.log(`Deleted content ${contentId}:`, {
        rowCount: result.rowCount,
        wasVideo: content?.content_type === 'video',
        hadPublicId: !!content?.video_public_id
      });

      // Return both deletion result and content info for cleanup
      return {
        success: result.rowCount > 0,
        content: content
      };
    } catch (error) {
      console.error('Course content deletion error:', error);
      throw error;
    }
  }

  static async checkContentOwnership(contentId, teacherId) {
    try {
      const rows = await executeQuery(`
        SELECT cc.id 
        FROM course_content cc
        JOIN courses c ON cc.course_id = c.id
        WHERE cc.id = $1 AND c.teacher_id = $2
      `, [contentId, teacherId]);
      
      const hasOwnership = rows.length > 0;
      console.log(`Content ownership check: content=${contentId}, teacher=${teacherId}, owned=${hasOwnership}`);
      
      return hasOwnership;
    } catch (error) {
      console.error('Check content ownership error:', error);
      throw error;
    }
  }

  // New method to get only video content for a course
  static async findVideosByCourseId(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          id,
          course_id,
          title,
          description,
          video_url,
          video_public_id,
          video_duration,
          display_order as order_index,
          is_published,
          created_at
        FROM course_content 
        WHERE course_id = $1 AND content_type = 'video'
        ORDER BY display_order ASC, created_at ASC
      `, [courseId]);
      
      console.log(`Found ${rows.length} videos for course ${courseId}`);
      return rows;
    } catch (error) {
      console.error('Find videos by course error:', error);
      throw error;
    }
  }

  // New method to update video-specific fields
  static async updateVideoInfo(contentId, videoData) {
    try {
      const { video_url, video_public_id, video_duration } = videoData;
      
      const result = await executeQuery(
        `UPDATE course_content 
         SET video_url = $1, video_public_id = $2, video_duration = $3, updated_at = NOW()
         WHERE id = $4 AND content_type = 'video'`,
        [video_url, video_public_id, video_duration, contentId]
      );

      console.log(`Updated video info for content ${contentId}:`, {
        rowCount: result.rowCount,
        video_url: !!video_url,
        video_public_id: !!video_public_id,
        video_duration: video_duration
      });

      return result.rowCount > 0;
    } catch (error) {
      console.error('Update video info error:', error);
      throw error;
    }
  }

  // New method to get content with video information
  static async getContentWithVideos(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          cc.*,
          c.title as course_title,
          c.teacher_id,
          cc.display_order as order_index
        FROM course_content cc
        JOIN courses c ON cc.course_id = c.id
        WHERE cc.course_id = $1 AND (cc.content_type = 'video' OR cc.video_url IS NOT NULL)
        ORDER BY cc.display_order ASC
      `, [courseId]);
      
      return rows;
    } catch (error) {
      console.error('Get content with videos error:', error);
      throw error;
    }
  }

  // New method to update content order
  static async updateContentOrder(contentId, orderIndex) {
    try {
      const result = await executeQuery(
        'UPDATE course_content SET display_order = $1, updated_at = NOW() WHERE id = $2',
        [orderIndex, contentId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('Update content order error:', error);
      throw error;
    }
  }

  // New method to get content statistics
  static async getContentStats(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          content_type,
          COUNT(*) as count,
          SUM(CASE WHEN content_type = 'video' THEN video_duration ELSE 0 END) as total_video_duration
        FROM course_content 
        WHERE course_id = $1 AND is_published = TRUE
        GROUP BY content_type
      `, [courseId]);
      
      const stats = {
        total: 0,
        byType: {},
        totalVideoDuration: 0
      };
      
      rows.forEach(row => {
        stats.total += row.count;
        stats.byType[row.content_type] = row.count;
        if (row.content_type === 'video') {
          stats.totalVideoDuration = row.total_video_duration || 0;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Get content stats error:', error);
      throw error;
    }
  }
}

module.exports = CourseContent;
