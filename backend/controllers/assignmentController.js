const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;

const sendResponse = (res, statusCode, message, data = null, success = true) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    response.data = data;
  }
  
  res.status(statusCode).json(response);
};

// Assignment Management
exports.createAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { courseId } = req.params;
    const { title, description, due_date, max_points, assignment_type } = req.body;
    const teacherId = req.userId;

    // Verify teacher owns the course
    const ownsCourse = await Course.checkTeacherOwnership(courseId, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to create assignments for this course', null, false);
    }

    const assignment = await Assignment.create({
      course_id: courseId,
      title,
      description,
      due_date,
      max_points,
      assignment_type
    });

    sendResponse(res, 201, 'Assignment created successfully', { assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    sendResponse(res, 500, 'Failed to create assignment', null, false);
  }
};

exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.findByCourseId(courseId);

    sendResponse(res, 200, 'Assignments retrieved successfully', { assignments });
  } catch (error) {
    console.error('Get course assignments error:', error);
    sendResponse(res, 500, 'Failed to retrieve assignments', null, false);
  }
};

// NEW: Get assignments for student's enrolled courses
exports.getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.userId;
    
    const assignments = await Assignment.findByStudentEnrolledCourses(studentId);
    
    sendResponse(res, 200, 'Student assignments retrieved successfully', { assignments });
  } catch (error) {
    console.error('Get student assignments error:', error);
    sendResponse(res, 500, 'Failed to retrieve student assignments', null, false);
  }
};

// NEW: Get assignments for specific enrolled course
exports.getStudentCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.userId;
    
    // Verify student is enrolled in this course
    const isEnrolled = await Enrollment.isEnrolled(studentId, courseId);
    if (!isEnrolled) {
      return sendResponse(res, 403, 'You are not enrolled in this course', null, false);
    }

    const assignments = await Assignment.findByCourseId(courseId);
    sendResponse(res, 200, 'Course assignments retrieved successfully', { assignments });
  } catch (error) {
    console.error('Get student course assignments error:', error);
    sendResponse(res, 500, 'Failed to retrieve course assignments', null, false);
  }
};

// FIXED: Submission Management
exports.submitAssignment = async (req, res) => {
  try {
    console.log('🔄 Submit assignment started...');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User ID:', req.userId);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { assignmentId } = req.params;
    const { submission_text } = req.body;
    const studentId = req.userId;

    console.log('📝 Processing submission for assignment:', assignmentId);

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.log('❌ Assignment not found');
      return sendResponse(res, 404, 'Assignment not found', null, false);
    }
    console.log('✅ Assignment found:', assignment.title);

    // Check if student is enrolled in the course
    const isEnrolled = await Enrollment.isEnrolled(studentId, assignment.course_id);
    if (!isEnrolled) {
      console.log('❌ Student not enrolled in course');
      return sendResponse(res, 403, 'You are not enrolled in this course', null, false);
    }
    console.log('✅ Student is enrolled');

    // Check if assignment is still open (not past due date)
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      console.log('❌ Assignment past due date');
      return sendResponse(res, 400, 'Assignment submission is past due date', null, false);
    }
    console.log('✅ Assignment is still open');

    let file_url = null;
    let file_public_id = null;

    // Handle file upload with better error handling
    if (req.file) {
      try {
        console.log('📁 File detected:', req.file.originalname);
        const file = req.file;
        
        // Use file.path if tempFilePath doesn't exist
        const filePath = file.tempFilePath || file.path;
        
        if (!filePath) {
          console.log('❌ No file path available');
          return sendResponse(res, 400, 'File upload failed - no file path', null, false);
        }

        console.log('☁️ Uploading to Cloudinary...');
        const fileResult = await cloudinary.uploader.upload(filePath, {
          resource_type: 'raw',
          folder: 'lms/assignments',
          use_filename: true,
          unique_filename: true
        });
        
        file_url = fileResult.secure_url;
        file_public_id = fileResult.public_id;
        
        console.log('✅ File uploaded to Cloudinary:', file_public_id);
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError);
        return sendResponse(res, 500, 'Failed to upload file. Please try again.', null, false);
      }
    } else {
      console.log('📝 No file uploaded, using text submission only');
    }

    // Check if student has already submitted
    console.log('🔍 Checking for existing submission...');
    const existingSubmission = await Submission.findByStudentAndAssignment(studentId, assignmentId);
    if (existingSubmission) {
      console.log('❌ Student already submitted this assignment');
      return sendResponse(res, 400, 'You have already submitted this assignment', null, false);
    }
    console.log('✅ No existing submission found');

    // Validate that we have at least text or file
    if (!submission_text && !file_url) {
      console.log('❌ No submission content provided');
      return sendResponse(res, 400, 'Either submission text or file upload is required', null, false);
    }

    // Create submission
    console.log('💾 Creating submission in database...');
    const submission = await Submission.create({
      assignment_id: assignmentId,
      student_id: studentId,
      submission_text: submission_text || null,
      file_url,
      file_public_id,
      submitted_at: new Date()
    });

    console.log('✅ Assignment submitted successfully:', submission.id);

    sendResponse(res, 201, 'Assignment submitted successfully!', { 
      submission,
      assignment_title: assignment.title
    });

  } catch (error) {
    console.error('💥 SUBMIT ASSIGNMENT ERROR:', error);
    console.error('💥 Error stack:', error.stack);
    
    // Better error messages
    if (error.message.includes('already submitted')) {
      return sendResponse(res, 400, 'You have already submitted this assignment', null, false);
    }
    if (error.message.includes('not enrolled')) {
      return sendResponse(res, 403, 'You are not enrolled in this course', null, false);
    }
    if (error.message.includes('due date')) {
      return sendResponse(res, 400, 'Assignment submission is past due date', null, false);
    }
    if (error.message.includes('Assignment ID and student ID are required')) {
      return sendResponse(res, 400, 'Missing required information', null, false);
    }
    
    sendResponse(res, 500, 'Unable to submit assignment. Please try again.', null, false);
  }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.userId;

    // Verify teacher has access to this assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return sendResponse(res, 404, 'Assignment not found', null, false);
    }

    const ownsCourse = await Course.checkTeacherOwnership(assignment.course_id, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to view submissions for this assignment', null, false);
    }

    const submissions = await Submission.findByAssignmentId(assignmentId);
    sendResponse(res, 200, 'Submissions retrieved successfully', { submissions });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    sendResponse(res, 500, 'Failed to retrieve submissions', null, false);
  }
};

exports.getStudentSubmissions = async (req, res) => {
  try {
    const studentId = req.userId;
    const submissions = await Submission.findByStudentId(studentId);

    sendResponse(res, 200, 'Student submissions retrieved successfully', { submissions });
  } catch (error) {
    console.error('Get student submissions error:', error);
    sendResponse(res, 500, 'Failed to retrieve submissions', null, false);
  }
};

// Grading System
exports.gradeSubmission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, 'Validation failed', { errors: errors.array() }, false);
    }

    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.userId;

    // Verify teacher has permission to grade
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return sendResponse(res, 404, 'Submission not found', null, false);
    }

    const assignment = await Assignment.findById(submission.assignment_id);
    const ownsCourse = await Course.checkTeacherOwnership(assignment.course_id, teacherId);
    if (!ownsCourse) {
      return sendResponse(res, 403, 'You do not have permission to grade this submission', null, false);
    }

    // Check if grade is within max points
    if (grade > assignment.max_points) {
      return sendResponse(res, 400, `Grade cannot exceed maximum points (${assignment.max_points})`, null, false);
    }

    await Submission.gradeSubmission(submissionId, {
      grade,
      feedback,
      graded_by: teacherId
    });

    sendResponse(res, 200, 'Submission graded successfully');
  } catch (error) {
    console.error('Grade submission error:', error);
    sendResponse(res, 500, 'Failed to grade submission', null, false);
  }
};

exports.getStudentGrades = async (req, res) => {
  try {
    const studentId = req.userId;
    const gradeStats = await Submission.getStudentGradeStats(studentId);

    sendResponse(res, 200, 'Student grades retrieved successfully', { grades: gradeStats });
  } catch (error) {
    console.error('Get student grades error:', error);
    sendResponse(res, 500, 'Failed to retrieve grades', null, false);
  }
};