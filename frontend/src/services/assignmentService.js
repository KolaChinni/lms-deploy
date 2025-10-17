import api from './api'

export const assignmentService = {
  // Create assignment (teacher only)
  async createAssignment(courseId, assignmentData) {
    const response = await api.post(`/assignments/courses/${courseId}/assignments`, assignmentData)
    return response.data
  },

  // Get course assignments
  async getCourseAssignments(courseId) {
    const response = await api.get(`/assignments/courses/${courseId}/assignments`)
    return response.data
  },

  // Get all assignments for student's enrolled courses
  async getStudentAssignments() {
    const response = await api.get('/assignments/student/assignments')
    return response.data
  },

  // Get assignments for specific enrolled course
  async getStudentCourseAssignments(courseId) {
    const response = await api.get(`/assignments/student/courses/${courseId}/assignments`)
    return response.data
  },

  // Submit assignment - FIXED: added double "assignments"
  async submitAssignment(assignmentId, submissionData) {
    try {
      const response = await api.post(`/assignments/assignments/${assignmentId}/submit`, submissionData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }
      })
      return response.data
    } catch (error) {
      console.error('Assignment submission error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get student submissions
  async getStudentSubmissions() {
    const response = await api.get('/assignments/student/submissions')
    return response.data
  },

  // Grade submission (teacher only)
  async gradeSubmission(submissionId, gradeData) {
    const response = await api.post(`/assignments/submissions/${submissionId}/grade`, gradeData)
    return response.data
  },

  // Get assignment submissions for teachers - FIXED: added double "assignments"
  async getAssignmentSubmissions(assignmentId) {
    try {
      const response = await api.get(`/assignments/assignments/${assignmentId}/submissions`)
      return response.data
    } catch (error) {
      console.error('Get assignment submissions error:', error.response?.data || error.message)
      throw error
    }
  },

  // Get student grades
  async getStudentGrades() {
    const response = await api.get('/assignments/student/grades')
    return response.data
  }
}