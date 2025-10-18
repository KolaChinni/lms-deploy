import api from './api'

export const assignmentService = {
  // ========== ASSIGNMENT MANAGEMENT (Teacher) ==========
  
  // Create a new assignment
  async createAssignment(courseId, assignmentData) {
    const response = await api.post(`/assignments/courses/${courseId}/assignments`, assignmentData)
    return response
  },

  // Get all assignments for a course
  async getCourseAssignments(courseId) {
    const response = await api.get(`/assignments/courses/${courseId}/assignments`)
    return response
  },

  // Get a specific assignment
  async getAssignment(assignmentId) {
    const response = await api.get(`/assignments/assignments/${assignmentId}`)
    return response
  },

  // Update an assignment
  async updateAssignment(assignmentId, assignmentData) {
    const response = await api.put(`/assignments/assignments/${assignmentId}`, assignmentData)
    return response
  },

  // Delete an assignment
  async deleteAssignment(assignmentId) {
    const response = await api.delete(`/assignments/assignments/${assignmentId}`)
    return response
  },

  // ========== ASSIGNMENT SUBMISSIONS (Student) ==========
  
  // Get all assignments for student's enrolled courses
  async getStudentAssignments() {
    const response = await api.get('/assignments/student/assignments')
    return response
  },

  // Get assignments for a specific enrolled course
  async getStudentCourseAssignments(courseId) {
    const response = await api.get(`/assignments/student/courses/${courseId}/assignments`)
    return response
  },

  // Submit an assignment
  async submitAssignment(assignmentId, submissionData) {
    try {
      const response = await api.post(`/assignments/assignments/${assignmentId}/submit`, submissionData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }
      })
      return response
    } catch (error) {
      console.error('Assignment submission error:', error)
      throw error
    }
  },

  // Get student's own submissions
  async getStudentSubmissions() {
    const response = await api.get('/assignments/student/submissions')
    return response
  },

  // Get a specific submission
  async getSubmission(submissionId) {
    const response = await api.get(`/assignments/submissions/${submissionId}`)
    return response
  },

  // Update a submission (before grading)
  async updateSubmission(submissionId, submissionData) {
    const response = await api.put(`/assignments/submissions/${submissionId}`, submissionData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    })
    return response
  },

  // ========== GRADING & EVALUATION (Teacher) ==========
  
  // Grade a submission
  async gradeSubmission(submissionId, gradeData) {
    const response = await api.post(`/assignments/submissions/${submissionId}/grade`, gradeData)
    return response
  },

  // Get all submissions for an assignment (teacher view)
  async getAssignmentSubmissions(assignmentId) {
    try {
      const response = await api.get(`/assignments/assignments/${assignmentId}/submissions`)
      return response
    } catch (error) {
      console.error('Get assignment submissions error:', error)
      throw error
    }
  },

  // Get all submissions for a course (teacher view)
  async getCourseSubmissions(courseId) {
    const response = await api.get(`/assignments/courses/${courseId}/submissions`)
    return response
  },

  // ========== GRADES & FEEDBACK ==========
  
  // Get student's grades across all courses
  async getStudentGrades() {
    const response = await api.get('/assignments/student/grades')
    return response
  },

  // Get grades for a specific course
  async getCourseGrades(courseId) {
    const response = await api.get(`/assignments/courses/${courseId}/grades`)
    return response
  },

  // Add feedback to a submission
  async addFeedback(submissionId, feedbackData) {
    const response = await api.post(`/assignments/submissions/${submissionId}/feedback`, feedbackData)
    return response
  },

  // ========== ASSIGNMENT TYPES & TEMPLATES ==========
  
  // Get assignment types (quiz, essay, project, etc.)
  async getAssignmentTypes() {
    // This could be a static list or from the backend
    return {
      types: [
        { value: 'assignment', label: 'Regular Assignment', icon: '📝' },
        { value: 'quiz', label: 'Quiz', icon: '📋' },
        { value: 'essay', label: 'Essay', icon: '📄' },
        { value: 'project', label: 'Project', icon: '💼' },
        { value: 'presentation', label: 'Presentation', icon: '🎤' },
        { value: 'code', label: 'Code Submission', icon: '💻' }
      ]
    }
  },

  // Get assignment templates
  async getAssignmentTemplates() {
    // This could be fetched from backend or kept static
    return {
      templates: [
        {
          id: 'basic-assignment',
          name: 'Basic Assignment',
          description: 'Standard assignment with instructions and due date',
          fields: ['title', 'instructions', 'due_date', 'max_points']
        },
        {
          id: 'quiz-template',
          name: 'Quiz Template',
          description: 'Multiple choice or short answer quiz',
          fields: ['title', 'instructions', 'due_date', 'max_points', 'questions']
        },
        {
          id: 'project-template',
          name: 'Project Template',
          description: 'Long-term project with milestones',
          fields: ['title', 'description', 'requirements', 'milestones', 'due_date', 'max_points']
        }
      ]
    }
  },

  // ========== UTILITY METHODS ==========
  
  // Calculate assignment statistics
  calculateAssignmentStats(assignments) {
    const total = assignments.length
    const submitted = assignments.filter(a => a.is_submitted).length
    const graded = assignments.filter(a => a.is_graded).length
    const averageGrade = assignments.length > 0 
      ? assignments.reduce((sum, a) => sum + (a.grade || 0), 0) / assignments.length 
      : 0

    return {
      total,
      submitted,
      graded,
      submissionRate: total > 0 ? (submitted / total) * 100 : 0,
      averageGrade: Math.round(averageGrade * 100) / 100
    }
  },

  // Format due date for display
  formatDueDate(dueDate) {
    if (!dueDate) return 'No due date'
    
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`
    } else {
      return date.toLocaleDateString()
    }
  },

  // Validate assignment data before submission
  validateAssignment(assignmentData) {
    const errors = {}

    if (!assignmentData.title?.trim()) {
      errors.title = 'Assignment title is required'
    }

    if (!assignmentData.instructions?.trim()) {
      errors.instructions = 'Instructions are required'
    }

    if (!assignmentData.due_date) {
      errors.due_date = 'Due date is required'
    } else if (new Date(assignmentData.due_date) < new Date()) {
      errors.due_date = 'Due date cannot be in the past'
    }

    if (!assignmentData.max_points || assignmentData.max_points <= 0) {
      errors.max_points = 'Maximum points must be greater than 0'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

export default assignmentService
