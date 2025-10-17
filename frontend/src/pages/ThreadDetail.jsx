import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumService } from '../services/forumService';

const ThreadDetail = () => {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const response = await forumService.getThread(threadId);
      setThread(response.data.thread);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to load thread:', error);
      alert('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) return;

    try {
      await forumService.createPost(threadId, {
        content: replyContent,
        parent_id: replyingTo
      });

      setReplyContent('');
      setReplyingTo(null);
      loadThread(); // Reload to get updated posts
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply');
    }
  };

  const handleReplyToPost = (postId) => {
    setReplyingTo(postId);
    // Scroll to reply form
    document.getElementById('reply-form').scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="thread-detail-page">
        <div className="container">
          <div className="loading-thread">
            <div className="loading-spinner"></div>
            <p>Loading thread...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="thread-detail-page">
        <div className="container">
          <div className="error-state">
            <h2>Thread not found</h2>
            <p>The thread you're looking for doesn't exist.</p>
            <Link to="/courses" className="btn btn-primary">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="thread-detail-page">
      <div className="container">
        {/* Header */}
        <div className="thread-header">
          <nav className="breadcrumb">
            <Link to="/courses">Courses</Link>
            <span> / </span>
            <Link to={`/courses/${thread.course_id}`}>Course</Link>
            <span> / </span>
            <Link to={`/courses/${thread.course_id}/forum`}>Forum</Link>
            <span> / </span>
            <span>Thread</span>
          </nav>

          <div className="thread-title-section">
            <div className="thread-meta">
              {thread.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
              {thread.is_locked && <span className="locked-badge">🔒 Locked</span>}
              <span className="views">👁️ {thread.view_count} views</span>
              <span className="replies">💬 {thread.reply_count} replies</span>
            </div>
            <h1>{thread.title}</h1>
            <div className="thread-author">
              <span className="author-name">By {thread.author_name}</span>
              <span className="author-role">({thread.author_role})</span>
              <span className="thread-date">
                {new Date(thread.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="posts-list">
          {/* Original Post */}
          <div className="post original-post">
            <div className="post-author">
              <div className="author-avatar">
                {thread.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="author-info">
                <strong>{thread.author_name}</strong>
                <span>{thread.author_role}</span>
              </div>
            </div>
            <div className="post-content">
              <div className="post-body">
                {thread.content}
              </div>
              <div className="post-actions">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => handleReplyToPost(null)}
                >
                  💬 Reply
                </button>
              </div>
            </div>
          </div>

          {/* Replies */}
          {posts.map(post => (
            <PostItem 
              key={post.id} 
              post={post} 
              onReply={handleReplyToPost}
            />
          ))}
        </div>

        {/* Reply Form */}
        {!thread.is_locked && (
          <div id="reply-form" className="reply-form-section">
            <h3>
              {replyingTo ? 'Replying to post' : 'Post a reply'}
              {replyingTo && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </button>
              )}
            </h3>
            <form onSubmit={handleSubmitReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows="4"
                className="reply-textarea"
              />
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!replyContent.trim()}
                >
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        )}

        {thread.is_locked && (
          <div className="locked-notice">
            <p>🔒 This thread is locked. No new replies can be posted.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PostItem = ({ post, onReply }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);

  const loadReplies = async () => {
    if (replies.length > 0) return; // Already loaded
    
    try {
      // This would need to be implemented in the backend
      // For now, we'll use the replies from the post object
      if (post.replies) {
        setReplies(post.replies);
      }
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className={`post ${post.is_answer ? 'answer-post' : ''}`}>
      {post.is_answer && <div className="answer-badge">✅ Answer</div>}
      
      <div className="post-author">
        <div className="author-avatar">
          {post.author_name.charAt(0).toUpperCase()}
        </div>
        <div className="author-info">
          <strong>{post.author_name}</strong>
          <span>{post.author_role}</span>
        </div>
      </div>

      <div className="post-content">
        <div className="post-body">
          {post.content}
        </div>
        
        <div className="post-footer">
          <div className="post-actions">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onReply(post.id)}
            >
              💬 Reply
            </button>
            {post.reply_count > 0 && (
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleToggleReplies}
              >
                {showReplies ? 'Hide' : 'Show'} {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          <div className="post-date">
            {new Date(post.created_at).toLocaleString()}
          </div>
        </div>

        {/* Nested Replies */}
        {showReplies && replies.length > 0 && (
          <div className="replies-list">
            {replies.map(reply => (
              <PostItem 
                key={reply.id} 
                post={reply} 
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadDetail;