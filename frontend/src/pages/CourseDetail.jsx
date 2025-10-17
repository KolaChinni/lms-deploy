import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { courseService } from '../services/courseService'
import { useAuth } from '../contexts/AuthContext'

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadCourseDetails()
  }, [courseId])

  const loadCourseDetails = async () => {
    try {
      setLoading(true)
      const response = await courseService.getCourseDetails(courseId)
      console.log('🔍 API Response:', response)
      
      if (response.data) {
        setCourse(response.data.course)
        setContent(response.data.content || [])
        
        // Debug log to see enrollment status
        console.log('✅ Enrollment Status from API:', {
          isEnrolled: response.data.isEnrolled,
          courseId: courseId,
          userId: user?.id
        })
      } else {
        setCourse(response.course || response)
        setContent(response.content || [])
      }
    } catch (error) {
      console.error('Failed to load course details:', error)
      alert('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setEnrolling(true)
    try {
      await courseService.enrollInCourse(courseId)
      await loadCourseDetails() // Reload to get updated enrollment status
      alert('Successfully enrolled in the course!')
    } catch (error) {
      console.error('Enrollment error:', error)
      alert(error.response?.data?.message || error.message || 'Failed to enroll in course')
    } finally {
      setEnrolling(false)
    }
  }

  const navigateToForum = () => {
    if (!user) {
      alert('Please login first to access the forum')
      navigate('/login')
      return
    }
    
    // Check enrollment status
    const isEnrolled = course?.isEnrolled
    const isTeacher = user?.role === 'teacher' && user?.id === course?.teacher_id
    
    console.log('🔍 Forum Access Check:', {
      user: user?.email,
      role: user?.role,
      isEnrolled: isEnrolled,
      isTeacher: isTeacher,
      courseTeacher: course?.teacher_id,
      userId: user?.id
    })
    
    if (!isEnrolled && !isTeacher) {
      alert('Please enroll in the course first to access the forum')
      return
    }
    
    navigate(`/courses/${courseId}/forum`)
  }

  const navigateToLearning = () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    const isEnrolled = course?.isEnrolled
    const isTeacher = user?.role === 'teacher' && user?.id === course?.teacher_id
    
    if (!isEnrolled && !isTeacher) {
      alert('Please enroll in the course first')
      return
    }
    
    navigate(`/learn/${courseId}`)
  }

  if (loading) {
    return (
      <div className="course-detail-page">
        <div className="container">
          <div className="loading-course">
            <div className="loading-spinner"></div>
            <p>Loading course details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="course-detail-page">
        <div className="container">
          <div className="error-state">
            <h2>Course not found</h2>
            <p>The course you're looking for doesn't exist.</p>
            <Link to="/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="course-detail-page">
      <div className="container">
        
        {/* Course Header */}
        <div className="course-hero">
          <div className="hero-content">
            <nav className="breadcrumb">
              <Link to="/courses" className="breadcrumb-link">Courses</Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{course.title}</span>
            </nav>
            
            <h1 className="course-title">{course.title}</h1>
            <p className="course-instructor">By {course.teacher_name || 'Instructor'}</p>
            
            <div className="course-meta">
              <div className="meta-item">
                <span className="meta-icon">📚</span>
                <div className="meta-content">
                  <strong>{content.length}</strong>
                  <span>Lessons</span>
                </div>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <div className="meta-content">
                  <strong>{course.student_count || 0}</strong>
                  <span>Students</span>
                </div>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🕒</span>
                <div className="meta-content">
                  <strong>{course.duration || 'Self-paced'}</strong>
                  <span>Duration</span>
                </div>
              </div>
              <div className="meta-item enrollment-status">
                <span className="meta-icon">🎓</span>
                <div className="meta-content">
                  <strong>{course.isEnrolled ? 'Enrolled ✅' : 'Not Enrolled'}</strong>
                  <span>Status</span>
                </div>
              </div>
            </div>

            <p className="course-description">
              {course.description || 'Master new skills with this comprehensive course designed for all levels.'}
            </p>

            {/* Action Buttons */}
            <div className="action-section">
              <div className="primary-actions">
                {!user ? (
                  <Link to="/login" className="btn btn-primary btn-large">
                    Login to Enroll
                  </Link>
                ) : user.role === 'student' ? (
                  course.isEnrolled ? (
                    <div className="action-group">
                      <button onClick={navigateToLearning} className="btn btn-primary btn-large">
                        Continue Learning
                      </button>
                      <button onClick={navigateToForum} className="btn btn-forum btn-large">
                        <span className="btn-icon">💬</span>
                        Course Forum
                      </button>
                    </div>
                  ) : (
                    <div className="enrollment-section">
                      <button 
                        onClick={handleEnroll} 
                        className="btn btn-primary btn-large"
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <span className="loading-spinner-small"></span>
                            Enrolling...
                          </>
                        ) : (
                          'Enroll Now - Free'
                        )}
                      </button>
                    </div>
                  )
                ) : user.role === 'teacher' && user.id === course.teacher_id ? (
                  <div className="action-group">
                    <button onClick={navigateToForum} className="btn btn-forum btn-large">
                      <span className="btn-icon">💬</span>
                      Course Forum
                    </button>
                    <Link to={`/teacher/courses/${course.id}/manage`} className="btn btn-outline btn-large">
                      Manage Course
                    </Link>
                  </div>
                ) : (
                  <div className="access-message">
                    <p>This course is available for enrolled students only</p>
                  </div>
                )}
              </div>

              {/* Enrollment Notice */}
              {user?.role === 'student' && !course.isEnrolled && (
                <div className="forum-notice">
                  <div className="notice-icon">💡</div>
                  <div className="notice-content">
                    <strong>Join the Discussion</strong>
                    <p>Enroll in this course to access the community forum and connect with other students</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rest of your professional content remains the same */}
        {/* ... */}
      </div>
    </div>
  )
}

export default CourseDetail