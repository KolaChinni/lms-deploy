const { executeQuery } = require('../config/database');

class Enrollment {
  static async enroll(studentId, courseId) {
    try {
      // Validate inputs
      if (!studentId || !courseId) {
        throw new Error('Student ID and Course ID are required');
      }

      console.log('📝 Enrolling student:', studentId, 'in course:', courseId);

      // Add validation for student and course existence
      const [student, course] = await Promise.all([
        executeQuery('SELECT id, name, role FROM users WHERE id = $1', [studentId]),
        executeQuery('SELECT id, title, is_published FROM courses WHERE id = $1', [courseId])
      ]);

      if (!student || student.length === 0) {
        throw new Error('Student not found');
      }

      if (student[0].role !== 'student') {
        throw new Error('Only students can enroll in courses');
      }

      if (!course || course.length === 0) {
        throw new Error('Course not found');
      }

      if (!course[0].is_published) {
        throw new Error('Course is not available for enrollment');
      }

      // Check if already enrolled
      const existing = await executeQuery(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );

      if (existing && existing.length > 0) {
        throw new Error('Student is already enrolled in this course');
      }

      // Create new enrollment
      const result = await executeQuery(
        'INSERT INTO enrollments (student_id, course_id, enrolled_at) VALUES ($1, $2, NOW()) RETURNING *',
        [studentId, courseId]
      );

      console.log('📝 Enrollment creation result:', result);

      // FIX: Handle the result properly
      if (!result) {
        throw new Error('Database query returned undefined result');
      }

      let enrollment;
      if (Array.isArray(result) && result.length > 0) {
        enrollment = result[0];
      } else if (result && result.id) {
        enrollment = result;
      } else {
        throw new Error('Failed to create enrollment: No valid ID returned from database');
      }

      console.log('✅ Enrollment created successfully:', enrollment.id);

      return { 
        id: enrollment.id, 
        student_id: studentId, 
        course_id: courseId,
        enrolled_at: new Date(),
        course_title: course[0].title,
        student_name: student[0].name
      };
    } catch (error) {
      console.error('❌ Enrollment error:', error);
      throw error;
    }
  }

  static async findByStudentId(studentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          e.*,
          c.title as course_title,
          c.description as course_description,
          c.duration as course_duration,
          u.name as teacher_name,
          u.email as teacher_email
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = $1
        ORDER BY e.enrolled_at DESC
      `, [studentId]);
      return rows || [];
    } catch (error) {
      console.error('Find enrollments by student error:', error);
      throw error;
    }
  }

  static async findByCourseId(courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          e.*,
          u.name as student_name,
          u.email as student_email
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.course_id = $1
        ORDER BY e.enrolled_at DESC
      `, [courseId]);
      return rows || [];
    } catch (error) {
      console.error('Find enrollments by course error:', error);
      throw error;
    }
  }

  static async isEnrolled(studentId, courseId) {
    try {
      const rows = await executeQuery(
        'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );
      return Array.isArray(rows) ? rows.length > 0 : false;
    } catch (error) {
      console.error('Check enrollment error:', error);
      throw error;
    }
  }

  static async getEnrollmentCount(courseId) {
    try {
      const rows = await executeQuery(
        'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1',
        [courseId]
      );
      return (Array.isArray(rows) && rows.length > 0) ? rows[0].count : 0;
    } catch (error) {
      console.error('Get enrollment count error:', error);
      throw error;
    }
  }

  static async updateStatus(enrollmentId, status) {
    try {
      const validStatuses = ['enrolled', 'completed', 'dropped'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid enrollment status');
      }

      const result = await executeQuery(
        'UPDATE enrollments SET status = $1 WHERE id = $2 RETURNING *',
        [status, enrollmentId]
      );

      if (!result || (Array.isArray(result) && result.length === 0)) {
        throw new Error('Enrollment not found');
      }

      return { id: enrollmentId, status };
    } catch (error) {
      console.error('Update enrollment status error:', error);
      throw error;
    }
  }

  static async getEnrollmentById(enrollmentId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          e.*,
          u.name as student_name,
          u.email as student_email,
          c.title as course_title,
          c.teacher_id as teacher_id
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.id = $1
      `, [enrollmentId]);
      
      return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
    } catch (error) {
      console.error('Get enrollment by ID error:', error);
      throw error;
    }
  }

  static async getStudentProgress(studentId, courseId) {
    try {
      const rows = await executeQuery(`
        SELECT 
          e.*,
          (SELECT COUNT(*) FROM student_progress 
           WHERE enrollment_id = e.id AND completed = true) as completed_lessons,
          (SELECT COUNT(*) FROM course_content 
           WHERE course_id = $1) as total_lessons
        FROM enrollments e
        WHERE e.student_id = $2 AND e.course_id = $3
      `, [courseId, studentId, courseId]);
      
      return (Array.isArray(rows) && rows.length > 0) ? rows[0] : null;
    } catch (error) {
      console.error('Get student progress error:', error);
      throw error;
    }
  }

  // Add this method for the assignment controller
  static async checkStudentEnrollment(courseId, studentId) {
    try {
      const rows = await executeQuery(
        'SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2',
        [courseId, studentId]
      );
      return Array.isArray(rows) ? rows.length > 0 : false;
    } catch (error) {
      console.error('Check student enrollment error:', error);
      throw error;
    }
  }
}

module.exports = Enrollment;
