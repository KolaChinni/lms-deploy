const { executeQuery } = require('../config/database');

class Assignment {
  static async create(assignmentData) {
    try {
      const { course_id, title, description, due_date, max_points, assignment_type } = assignmentData;
      
      if (!course_id || !title || !max_points) {
        throw new Error('Course ID, title, and max points are required');
      }

      const result = await executeQuery(
        `INSERT INTO assignments 
         (course_id, title, description, due_date, max_points, assignment_type, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [course_id, title.trim(), description?.trim(), due_date, max_points, assignment_type || 'assignment']
      );

      return { 
        id: result.insertId,
        course_id,
        title: title.trim(),
        description: description?.trim(),
        due_date,
        max_points,
        assignment_type: assignment_type || 'assignment',
        created_at: new Date()
      };
    } catch (error) {
      console.error('Assignment creation error:', error);
      throw error;
    }
  }

  static async findByCourseId(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT * FROM assignments 
        WHERE course_id = ?
        ORDER BY created_at DESC
      `, [courseId]);
      return rows;
    } catch (error) {
      console.error('Find assignments by course error:', error);
      throw error;
    }
  }

  static async findById(assignmentId) {
    try {
      const rows = await executeQuery(`
        SELECT a.*, c.title as course_title, c.teacher_id
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = ?
      `, [assignmentId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Find assignment by ID error:', error);
      throw error;
    }
  }

  static async findByStudentEnrolledCourses(studentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          a.*,
          c.title as course_title,
          c.teacher_id,
          u.name as teacher_name,
          (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as has_submitted,
          (SELECT s.grade FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as student_grade,
          (SELECT s.submitted_at FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as submitted_at,
          (SELECT s.feedback FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = ?) as feedback
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id IN (
          SELECT course_id FROM enrollments WHERE student_id = ?
        )
        AND c.is_published = TRUE
        ORDER BY a.due_date ASC, a.created_at DESC
      `, [studentId, studentId, studentId, studentId, studentId]);
      return rows;
    } catch (error) {
      console.error('Find assignments by student enrolled courses error:', error);
      throw error;
    }
  }

  static async update(assignmentId, updateData) {
    try {
      const { title, description, due_date, max_points, assignment_type } = updateData;
      
      const result = await executeQuery(
        `UPDATE assignments 
         SET title = ?, description = ?, due_date = ?, max_points = ?, assignment_type = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, description, due_date, max_points, assignment_type, assignmentId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Assignment update error:', error);
      throw error;
    }
  }

  static async delete(assignmentId) {
    try {
      const result = await executeQuery(
        'DELETE FROM assignments WHERE id = ?',
        [assignmentId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Assignment deletion error:', error);
      throw error;
    }
  }
}

module.exports = Assignment;