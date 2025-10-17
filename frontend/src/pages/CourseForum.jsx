import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { forumService } from '../services/forumService';
import { courseService } from '../services/courseService';
import { useAuth } from '../contexts/AuthContext';
import CreateThreadModal from '../components/CreateThreadModal';
import SearchThreads from '../components/SearchThreads';

const CourseForum = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadForumData();
  }, [courseId]);

  const loadForumData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [forumResponse, courseResponse] = await Promise.all([
        forumService.getCourseForum(courseId),
        courseService.getCourse(courseId)
      ]);

      console.log('Forum API Response:', forumResponse);
      console.log('Course API Response:', courseResponse);

      // Handle forum response - your backend returns categories in data.categories
      if (forumResponse.data && forumResponse.data.categories) {
        setCategories(forumResponse.data.categories);
      } else {
        setCategories([]);
      }

      // Handle course response
      if (courseResponse.data) {
        setCourse(courseResponse.data.course || courseResponse.data);
      } else {
        setCourse(courseResponse.course || courseResponse);
      }

    } catch (error) {
      console.error('Failed to load forum data:', error);
      setError('Failed to load forum data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadCreated = () => {
    setShowCreateThread(false);
    loadForumData(); // Reload to show the new thread
  };

  const handleSearch = async (query) => {
    try {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      
      const response = await forumService.searchThreads(courseId, query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  const navigateToThread = (threadId) => {
    navigate(`/forum/thread/${threadId}`);
  };

  if (loading) {
    return (
      <div className="course-forum-page">
        <div className="container">
          <div className="loading-forum">
            <div className="loading-spinner"></div>
            <p>Loading forum...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-forum-page">
        <div className="container">
          <div className="error-state">
            <h2>Error Loading Forum</h2>
            <p>{error}</p>
            <button onClick={loadForumData} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-forum-page">
      <div className="container">
        {/* Header */}
        <div className="forum-header">
          <div className="header-content">
            <nav className="breadcrumb">
              <Link to="/courses">Courses</Link>
              <span> / </span>
              <Link to={`/courses/${courseId}`}>{course?.title || 'Course'}</Link>
              <span> / </span>
              <span>Discussion Forum</span>
            </nav>
            <h1>💬 {course?.title || 'Course'} - Discussion Forum</h1>
            <p>Discuss course content, ask questions, and help each other</p>
          </div>
          
          <div className="header-actions">
            <SearchThreads 
              courseId={courseId}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
            />
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateThread(true)}
              disabled={categories.length === 0}
            >
              📝 New Thread
            </button>
          </div>
        </div>

        {categories.length === 0 && (
          <div className="empty-forum">
            <div className="empty-icon">💬</div>
            <h3>Forum Setup Required</h3>
            <p>The forum for this course hasn't been set up yet.</p>
            {user?.role === 'teacher' && (
              <p>As a teacher, you can set up the forum categories.</p>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="search-results-section">
            <div className="section-header">
              <h3>🔍 Search Results</h3>
              <button className="btn btn-outline btn-sm" onClick={handleClearSearch}>
                Clear Search
              </button>
            </div>
            <div className="threads-grid">
              {searchResults.threads && searchResults.threads.length > 0 ? (
                searchResults.threads.map(thread => (
                  <ThreadCard 
                    key={thread.id} 
                    thread={thread} 
                    onClick={() => navigateToThread(thread.id)}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>No threads found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {!searchResults && categories.length > 0 && (
          <div className="categories-section">
            <h2>Discussion Categories</h2>
            <div className="categories-grid">
              {categories.map(category => (
                <ForumCategory 
                  key={category.id} 
                  category={category}
                  onThreadClick={() => setSelectedCategory(category)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        <CreateThreadModal
          courseId={courseId}
          categories={categories}
          isOpen={showCreateThread}
          onClose={() => setShowCreateThread(false)}
          onThreadCreated={handleThreadCreated}
        />

        {selectedCategory && (
          <ThreadsListModal
            category={selectedCategory}
            isOpen={!!selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onThreadClick={navigateToThread}
          />
        )}
      </div>
    </div>
  );
};

const ForumCategory = ({ category, onThreadClick }) => {
  const formatLastActivity = (dateString) => {
    if (!dateString) return 'No activity';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Recent';
    }
  };

  return (
    <div className="forum-category">
      <div className="category-header" onClick={onThreadClick}>
        <div className="category-info">
          <h3>{category.title}</h3>
          <p>{category.description}</p>
        </div>
        <div className="category-stats">
          <div className="stat">
            <span className="stat-number">{category.thread_count || 0}</span>
            <span className="stat-label">Threads</span>
          </div>
          <div className="stat">
            <span className="stat-number">{category.post_count || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat">
            <span className="stat-date">
              {formatLastActivity(category.last_activity)}
            </span>
            <span className="stat-label">Last Activity</span>
          </div>
        </div>
        <div className="category-arrow">→</div>
      </div>
    </div>
  );
};

const ThreadCard = ({ thread, onClick }) => {
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Recent';
    }
  };

  return (
    <div className="thread-card" onClick={onClick}>
      <div className="thread-header">
        <div className="thread-title">
          {thread.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
          <h4>{thread.title}</h4>
        </div>
        <div className="thread-meta">
          <span className="replies">{thread.reply_count || thread.total_replies || 0} replies</span>
          <span className="views">{thread.view_count || 0} views</span>
        </div>
      </div>
      
      <div className="thread-content">
        <p className="thread-excerpt">
          {thread.content ? (
            thread.content.substring(0, 150) + (thread.content.length > 150 ? '...' : '')
          ) : (
            'No content'
          )}
        </p>
      </div>

      <div className="thread-footer">
        <div className="author-info">
          <span className="author-name">{thread.author_name || 'Unknown'}</span>
          <span className="author-role">{thread.author_role || 'User'}</span>
        </div>
        <div className="thread-dates">
          <span className="created-date">
            Started {formatDate(thread.created_at)}
          </span>
          {thread.last_reply_date && (
            <span className="last-reply">
              Last reply {formatDate(thread.last_reply_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Threads List Modal Component
const ThreadsListModal = ({ category, isOpen, onClose, onThreadClick }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && category) {
      loadThreads();
    }
  }, [isOpen, category]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const response = await forumService.getThreadsByCategory(category.id);
      setThreads(response.data.threads || []);
    } catch (error) {
      console.error('Failed to load threads:', error);
      alert('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 {category.title} - Threads</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-threads">
              <div className="loading-spinner"></div>
              <p>Loading threads...</p>
            </div>
          ) : (
            <div className="threads-list">
              {threads.length > 0 ? (
                threads.map(thread => (
                  <ThreadCard 
                    key={thread.id} 
                    thread={thread} 
                    onClick={() => {
                      onThreadClick(thread.id);
                      onClose();
                    }}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <p>No threads in this category yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseForum;