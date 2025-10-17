import React, { useState, useEffect } from 'react'
import { assignmentService } from '../services/assignmentService'
import { useAuth } from '../contexts/AuthContext'
import SubmitAssignmentModal from '../components/SubmitAssignmentModal'

const StudentAssignments = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    try {
      // Load both assignments and submissions
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentService.getStudentAssignments(),
        assignmentService.getStudentSubmissions()
      ])
      
      setAssignments(assignmentsRes.data.assignments || [])
      setSubmissions(submissionsRes.data.submissions || [])
    } catch (error) {
      console.error('Failed to load student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment)
    setShowSubmitModal(true)
  }

  const handleSubmissionCreated = () => {
    loadStudentData()
    setShowSubmitModal(false)
    setSelectedAssignment(null)
  }

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find(sub => sub.assignment_id === assignmentId)
  }

  const getStatusInfo = (assignment) => {
    const submission = getSubmissionForAssignment(assignment.id)
    const now = new Date()
    const due = new Date(assignment.due_date)
    
    if (submission) {
      if (submission.grade !== null) {
        return { status: 'graded', label: 'Graded', color: 'success' }
      }
      return { status: 'submitted', label: 'Submitted', color: 'info' }
    }
    
    if (now > due) {
      return { status: 'overdue', label: 'Overdue', color: 'error' }
    }
    
    return { status: 'pending', label: 'Pending Submission', color: 'warning' }
  }

  if (loading) {
    return (
      <div className="student-assignments-page">
        <div className="container">
          <div className="loading-assignments">
            <div className="loading-spinner"></div>
            <p>Loading your assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  // Group assignments by course
  const assignmentsByCourse = assignments.reduce((acc, assignment) => {
    const courseTitle = assignment.course_title
    if (!acc[courseTitle]) {
      acc[courseTitle] = []
    }
    acc[courseTitle].push(assignment)
    return acc
  }, {})

  return (
    <div className="student-assignments-page">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>My Assignments</h1>
            <p>Track your assignment submissions and grades</p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No assignments available</h3>
            <p>You don't have any assignments in your enrolled courses yet.</p>
          </div>
        ) : (
          <div className="assignments-by-course">
            {Object.entries(assignmentsByCourse).map(([courseTitle, courseAssignments]) => (
              <div key={courseTitle} className="course-assignments">
                <h2 className="course-title">{courseTitle}</h2>
                <div className="assignments-list">
                  {courseAssignments.map(assignment => {
                    const submission = getSubmissionForAssignment(assignment.id)
                    const statusInfo = getStatusInfo(assignment)
                    
                    return (
                      <div key={assignment.id} className={`assignment-card ${statusInfo.status}`}>
                        <div className="assignment-header">
                          <h3>{assignment.title}</h3>
                          <span className={`status-badge ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="assignment-details">
                          <p><strong>Teacher:</strong> {assignment.teacher_name}</p>
                          <p><strong>Due Date:</strong> {new Date(assignment.due_date).toLocaleString()}</p>
                          <p><strong>Max Points:</strong> {assignment.max_points}</p>
                          <p><strong>Type:</strong> {assignment.assignment_type}</p>
                          
                          {assignment.description && (
                            <div className="assignment-description">
                              <strong>Description:</strong>
                              <p>{assignment.description}</p>
                            </div>
                          )}
                          
                          {submission && submission.grade !== null && (
                            <p><strong>Your Grade:</strong> 
                              <span className="grade"> {submission.grade}/{assignment.max_points}</span>
                            </p>
                          )}
                          
                          {submission && submission.feedback && (
                            <div className="feedback">
                              <strong>Feedback:</strong>
                              <p>{submission.feedback}</p>
                            </div>
                          )}
                        </div>

                        <div className="assignment-actions">
                          {!submission && statusInfo.status !== 'overdue' && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSubmitAssignment(assignment)}
                            >
                              Submit Assignment
                            </button>
                          )}
                          
                          {submission && (
                            <div className="submission-info">
                              <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                              {submission.file_url && (
                                <a 
                                  href={submission.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-outline btn-sm"
                                >
                                  Download Submission
                                </a>
                              )}
                            </div>
                          )}

                          {statusInfo.status === 'overdue' && !submission && (
                            <div className="overdue-notice">
                              <p className="text-error">This assignment is overdue</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <SubmitAssignmentModal
          assignment={selectedAssignment}
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmissionCreated={handleSubmissionCreated}
        />
      </div>
    </div>
  )
}

export default StudentAssignments