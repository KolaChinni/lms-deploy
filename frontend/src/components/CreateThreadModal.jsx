import React, { useState } from 'react';
import { forumService } from '../services/forumService';

const CreateThreadModal = ({ courseId, categories, isOpen, onClose, onThreadCreated }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.title || !formData.content) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forumService.createThread(formData.category_id, {
        title: formData.title,
        content: formData.content
      });

      onThreadCreated();
      resetForm();
    } catch (error) {
      console.error('Failed to create thread:', error);
      setError(error.message || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      title: '',
      content: ''
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📝 Create New Thread</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="thread-form">
          {error && (
            <div className="form-error">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Thread Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter a descriptive title for your thread..."
              disabled={loading}
              maxLength={255}
            />
            <div className="character-count">
              {formData.title.length}/255 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Write your question or discussion topic here..."
              rows="8"
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.category_id || !formData.title || !formData.content}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Creating...
                </>
              ) : (
                'Create Thread'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateThreadModal;