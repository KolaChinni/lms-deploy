const { executeQuery } = require('../config/database');

class Assignment {
  static async create(assignmentData) {
    try {
      const { course_id, title, description, due_date, max_points, assignment_type } = assignmentData;
      
      if (!course_id || !title || !max_points) {
        throw new Error('Course ID, title, and max points are required');
      }

      console.log('📝 Creating assignment with data:', assignmentData);

      const result = await executeQuery(
        `INSERT INTO assignments 
         (course_id, title, description, due_date, max_points, assignment_type, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [course_id, title.trim(), description?.trim(), due_date, max_points, assignment_type || 'assignment']
      );

      console.log('📝 Assignment creation result:', result);

      // FIXED: Handle the result properly
      if (!result) {
        throw new Error('Database query returned undefined result');
      }

      let assignment;
      if (Array.isArray(result) && result.length > 0) {
        assignment = result[0];
      } else if (result && result.id) {
        assignment = result;
      } else {
        throw new Error('Failed to create assignment: No valid ID returned from database');
      }

      console.log('✅ Assignment created successfully with ID:', assignment.id);

      return assignment;
    } catch (error) {
      console.error('❌ Assignment creation error:', error);
      throw error;
    }
  }

  static async findByCourseId(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT * FROM assignments 
        WHERE course_id = $1
        ORDER BY created_at DESC
      `, [courseId]);
      return rows || [];
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
        WHERE a.id = $1
      `, [assignmentId]);
      return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
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
          (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $1) as has_submitted,
          (SELECT s.grade FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $2) as student_grade,
          (SELECT s.submitted_at FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $3) as submitted_at,
          (SELECT s.feedback FROM submissions s WHERE s.assignment_id = a.id AND s.student_id = $4) as feedback
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id IN (
          SELECT course_id FROM enrollments WHERE student_id = $5
        )
        AND c.is_published = TRUE
        ORDER BY a.due_date ASC, a.created_at DESC
      `, [studentId, studentId, studentId, studentId, studentId]);
      return rows || [];
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
         SET title = $1, description = $2, due_date = $3, max_points = $4, assignment_type = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [title, description, due_date, max_points, assignment_type, assignmentId]
      );

      return result ? (Array.isArray(result) ? result.length > 0 : !!result.id) : false;
    } catch (error) {
      console.error('Assignment update error:', error);
      throw error;
    }
  }

  static async delete(assignmentId) {
    try {
      const result = await executeQuery(
        'DELETE FROM assignments WHERE id = $1',
        [assignmentId]
      );
      return result ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Assignment deletion error:', error);
      throw error;
    }
  }
}

module.exports = Assignment;
