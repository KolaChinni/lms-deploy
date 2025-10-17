import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { courseService } from '../services/courseService'
import { assignmentService } from '../services/assignmentService'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [recentAssignments, setRecentAssignments] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    if (user) {
      loadDashboardData()
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadDashboardData()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading dashboard data...')
      
      const [coursesResponse, assignmentsResponse, progressResponse] = await Promise.all([
        courseService.getStudentCourses().catch(err => {
          console.error('Failed to load courses:', err)
          return { data: { enrollments: [] } }
        }),
        assignmentService.getStudentSubmissions().catch(err => {
          console.error('Failed to load assignments:', err)
          return { data: { submissions: [] } }
        }),
        courseService.getStudentProgress().catch(err => {
          console.error('Failed to load progress:', err)
          return { data: { progress: [] } }
        })
      ])

      console.log('📊 Courses response:', coursesResponse.data)
      console.log('📝 Assignments response:', assignmentsResponse.data)
      console.log('📈 Progress response:', progressResponse.data)

      setEnrolledCourses(coursesResponse.data?.enrollments?.slice(0, 4) || [])
      setRecentAssignments(assignmentsResponse.data?.submissions?.slice(0, 3) || [])
      setProgress(progressResponse.data?.progress || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOverallProgress = () => {
    if (progress.length === 0) return 0
    const totalProgress = progress.reduce((sum, course) => sum + (course.progress_percentage || 0), 0)
    return Math.round(totalProgress / progress.length)
  }

  const navigateToCourseForum = (courseId) => {
    navigate(`/courses/${courseId}/forum`)
  }

  const refreshDashboard = () => {
    loadDashboardData()
  }

  if (loading && enrolledCourses.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-dashboard">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-header">
            <div>
              <h1>Welcome back, {user?.name}! 👋</h1>
              <p>Continue your learning journey and track your progress</p>
            </div>
            <div className="dashboard-actions">
              <button onClick={refreshDashboard} className="btn btn-outline btn-sm">
                🔄 Refresh
              </button>
              {lastUpdated && (
                <span className="last-updated">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Enrolled Courses</h3>
              <div className="stat-number">{enrolledCourses.length}</div>
              <p>Active courses</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Overall Progress</h3>
              <div className="stat-number">{getOverallProgress()}%</div>
              <p>Average completion</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Assignments</h3>
              <div className="stat-number">{recentAssignments.length}</div>
              <p>Recent activity</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>Forum Access</h3>
              <div className="stat-number">{enrolledCourses.length}</div>
              <p>Course discussions</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Quick Actions */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions-grid">
              {/* ADDED CHATBOT LINK - REPLACE THE URL WITH YOUR ACTUAL CHATBOT WEBSITE */}
              <a 
                href="https://doubt-bot-omap-eii1q8i98-venkats-projects-806f78f4.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="quick-action-card"
              >
                <div className="action-icon">🤖</div>
                <div className="action-content">
                  <h4>AI Assistant</h4>
                  <p>Get help from our chatbot</p>
                </div>
              </a>
              
              <Link to="/courses" className="quick-action-card">
                <div className="action-icon">🔍</div>
                <div className="action-content">
                  <h4>Browse Courses</h4>
                  <p>Discover new courses to enroll in</p>
                </div>
              </Link>
              
              <Link to="/my-courses" className="quick-action-card">
                <div className="action-icon">📚</div>
                <div className="action-content">
                  <h4>My Courses</h4>
                  <p>View all your enrolled courses</p>
                </div>
              </Link>

              {/* ADDED MY ASSIGNMENTS LINK */}
              <Link to="/my-assignments" className="quick-action-card">
                <div className="action-icon">📝</div>
                <div className="action-content">
                  <h4>My Assignments</h4>
                  <p>View and submit assignments</p>
                </div>
              </Link>
              
              {enrolledCourses.length > 0 && (
                <div className="quick-action-card" onClick={() => navigateToCourseForum(enrolledCourses[0].course_id)}>
                  <div className="action-icon">💬</div>
                  <div className="action-content">
                    <h4>Course Forum</h4>
                    <p>Join course discussions</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Course Forums Section */}
          {enrolledCourses.length > 0 && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Course Forums</h2>
                <span className="section-subtitle">Join discussions in your enrolled courses</span>
              </div>
              
              <div className="forums-grid">
                {enrolledCourses.map(course => (
                  <ForumCard 
                    key={course.course_id} 
                    course={course} 
                    onNavigate={() => navigateToCourseForum(course.course_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Enrolled Courses */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Your Courses</h2>
              <Link to="/my-courses" className="btn btn-outline btn-sm">
                View All
              </Link>
            </div>
            
            {enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No courses enrolled yet</h3>
                <p>Start your learning journey by enrolling in courses</p>
                <Link to="/courses" className="btn btn-primary">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="courses-grid compact">
                {enrolledCourses.map(course => (
                  <CourseCard key={course.course_id} course={course} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>
            
            <div className="activity-list">
              {recentAssignments.length === 0 ? (
                <div className="empty-activity">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentAssignments.map(assignment => (
                  <ActivityItem key={assignment.id} assignment={assignment} />
                ))
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Progress Overview</h2>
            </div>
            
            <div className="progress-list">
              {progress.length === 0 ? (
                <div className="empty-progress">
                  <p>Start learning to track your progress</p>
                </div>
              ) : (
                progress.map(courseProgress => (
                  <ProgressItem key={courseProgress.course_id} progress={courseProgress} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CourseCard = ({ course }) => {
  const progress = course.progress?.overall_progress || 0

  return (
    <div className="course-card compact">
      <div className="course-header">
        <h4 className="course-title">{course.course_title}</h4>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{progress}% complete</span>
      </div>
      
      <div className="course-actions">
        <Link 
          to={`/learn/${course.course_id}`} 
          className="btn btn-primary btn-sm"
        >
          {progress > 0 ? 'Continue' : 'Start'}
        </Link>
      </div>
    </div>
  )
}

const ForumCard = ({ course, onNavigate }) => {
  return (
    <div className="forum-card" onClick={onNavigate}>
      <div className="forum-header">
        <div className="forum-icon">💬</div>
        <div className="forum-info">
          <h4>{course.course_title}</h4>
          <p>Course discussion forum</p>
        </div>
      </div>
      <div className="forum-actions">
        <button className="btn btn-forum btn-sm">
          Join Discussion
        </button>
      </div>
    </div>
  )
}

const ActivityItem = ({ assignment }) => {
  const getStatusColor = () => {
    if (assignment.grade !== null && assignment.grade !== undefined) return 'success'
    return 'info'
  }

  return (
    <div className="activity-item">
      <div className="activity-icon">📝</div>
      <div className="activity-content">
        <h4>{assignment.assignment_title}</h4>
        <p>Submitted on {new Date(assignment.submitted_at).toLocaleDateString()}</p>
        <div className="activity-meta">
          <span className={`status-badge ${getStatusColor()}`}>
            {assignment.grade !== null && assignment.grade !== undefined 
              ? `Graded: ${assignment.grade}/${assignment.max_points}` 
              : 'Pending Review'}
          </span>
          <span className="course-name">{assignment.course_title}</span>
        </div>
      </div>
    </div>
  )
}

const ProgressItem = ({ progress }) => {
  return (
    <div className="progress-item">
      <div className="progress-info">
        <h4>{progress.course_title}</h4>
        <div className="progress-stats">
          <span>{progress.completed_content || 0}/{progress.total_content || 0} lessons</span>
          <span>{progress.progress_percentage || 0}% complete</span>
        </div>
      </div>
      <div className="progress-bar large">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.progress_percentage || 0}%` }}
        ></div>
      </div>
    </div>
  )
}

export default Dashboard