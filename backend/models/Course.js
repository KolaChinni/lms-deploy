const { executeQuery } = require('../config/database');
const Enrollment = require('./Enrollment');

class Course {
  static async create(courseData) {
    try {
      const { title, description, duration, teacher_id } = courseData;
      
      // Validate required fields
      if (!title || !description || !teacher_id) {
        throw new Error('Title, description, and teacher ID are required');
      }

      const result = await executeQuery(
        `INSERT INTO courses (title, description, duration, teacher_id, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [title.trim(), description.trim(), duration || null, teacher_id]
      );

      return { 
        id: result[0].id, 
        title: title.trim(), 
        description: description.trim(), 
        duration,
        teacher_id,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Course creation error:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.*,
          u.name as teacher_name,
          u.email as teacher_email,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.is_published = TRUE
        ORDER BY c.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Find all courses error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.*,
          u.name as teacher_name,
          u.email as teacher_email
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id = $1
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Find course by ID error:', error);
      throw error;
    }
  }

  static async findByTeacherId(teacherId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
        FROM courses c
        WHERE c.teacher_id = $1
        ORDER BY c.created_at DESC
      `, [teacherId]);
      return rows;
    } catch (error) {
      console.error('Find courses by teacher error:', error);
      throw error;
    }
  }

  static async update(courseId, teacherId, updateData) {
    try {
      const { title, description, duration, is_published } = updateData;
      
      const result = await executeQuery(
        `UPDATE courses 
         SET title = $1, description = $2, duration = $3, is_published = $4, updated_at = NOW()
         WHERE id = $5 AND teacher_id = $6`,
        [title, description, duration, is_published, courseId, teacherId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('Course update error:', error);
      throw error;
    }
  }

  // FIXED: Remove teacherId parameter to match controller call
  static async delete(courseId) {
    try {
      const result = await executeQuery(
        'DELETE FROM courses WHERE id = $1',
        [courseId]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Course deletion error:', error);
      throw error;
    }
  }

  static async checkTeacherOwnership(courseId, teacherId) {
    try {
      const rows = await executeQuery(
        'SELECT id FROM courses WHERE id = $1 AND teacher_id = $2',
        [courseId, teacherId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Check course ownership error:', error);
      throw error;
    }
  }

  // NEW: Enhanced method to get course with enrollment status
  static async getCourseWithEnrollmentStatus(courseId, userId) {
    try {
      const course = await this.findById(courseId);
      if (!course) return null;
      
      const isEnrolled = await Enrollment.isEnrolled(userId, courseId);
      return {
        ...course,
        isEnrolled
      };
    } catch (error) {
      console.error('Get course with enrollment status error:', error);
      throw error;
    }
  }
}

module.exports = Course;
