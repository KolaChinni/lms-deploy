import React, { useState } from 'react';
import { courseService } from '../services/courseService';
import { documentService } from '../services/documentService'; // We'll create this

const AddContentModal = ({ courseId, isOpen, onClose, onContentAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'document', // Default to document
    orderIndex: 0
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid document file (PDF, Word, PowerPoint, Excel, Text)');
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('Document file must be less than 50MB');
        return;
      }

      setDocumentFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a title for the content');
      return;
    }

    if (formData.content_type === 'document' && !documentFile) {
      setError('Please select a document file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting content creation process...');
      
      let documentUrl = null;
      let documentPublicId = null;

      // Upload document to Cloudinary if it's a document type
      if (formData.content_type === 'document' && documentFile) {
        console.log('Uploading document to Cloudinary...');
        const uploadResponse = await documentService.uploadDocument(documentFile);
        
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'Document upload failed');
        }

        console.log('Cloudinary document upload successful:', uploadResponse.document);
        documentUrl = uploadResponse.document.secure_url;
        documentPublicId = uploadResponse.document.public_id;
      }

      // Prepare content data
      const contentData = {
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        order_index: formData.orderIndex,
        document_url: documentUrl,
        document_public_id: documentPublicId
      };

      console.log('Adding content to course:', contentData);
      const contentResponse = await courseService.addCourseContent(courseId, contentData);

      if (contentResponse.success) {
        console.log('Content added successfully:', contentResponse.content);
        onContentAdded(contentResponse.content);
        resetForm();
        onClose();
      } else {
        throw new Error(contentResponse.message || 'Failed to add content');
      }

    } catch (error) {
      console.error('Content creation process error:', error);
      setError(error.message || 'Failed to add content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'document',
      orderIndex: 0
    });
    setDocumentFile(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📈';
    if (fileType.includes('text')) return '📃';
    return '📎';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>📚 Add Course Content</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="content-upload-form">
          {error && (
            <div className="api-error">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <p className="error-message">{error}</p>
                <p className="error-suggestion">
                  Please check the file format and size, then try again.
                </p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="contentType">Content Type</label>
            <select
              id="contentType"
              value={formData.content_type}
              onChange={(e) => setFormData({...formData, content_type: e.target.value})}
              disabled={loading}
            >
              <option value="document">Document (PDF, Word, PPT, etc.)</option>
              <option value="quiz">Quiz/Assessment</option>
              <option value="text">Text Content</option>
              <option value="link">External Link</option>
            </select>
          </div>

          {formData.content_type === 'document' && (
            <div className="form-group">
              <label htmlFor="documentFile">
                Document File *
                <span className="field-info">(PDF, Word, PowerPoint, Excel, Text - Max 50MB)</span>
              </label>
              <input
                type="file"
                id="documentFile"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={loading}
              />
              {documentFile && (
                <div className="file-info">
                  <div className="file-details">
                    <span className="file-icon">{getFileTypeIcon(documentFile.type)}</span>
                    <div className="file-meta">
                      <strong>{documentFile.name}</strong>
                      <span>{formatFileSize(documentFile.size)}</span>
                      <span className="file-type">{documentFile.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Content Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Course Syllabus, Lecture Notes, Quiz 1..."
              disabled={loading}
              maxLength={255}
            />
            <div className="character-count">
              {formData.title.length}/255 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
              <span className="field-info">(Optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this content contains..."
              rows="3"
              disabled={loading}
              maxLength={1000}
            />
            <div className="character-count">
              {formData.description.length}/1000 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="orderIndex">
              Display Order
              <span className="field-info">(Optional)</span>
            </label>
            <input
              type="number"
              id="orderIndex"
              value={formData.orderIndex}
              onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})}
              min="0"
              placeholder="0"
              disabled={loading}
            />
            <div className="field-help">
              Lower numbers appear first in the course content list
            </div>
          </div>

          {loading && (
            <div className="upload-status">
              <div className="loading-spinner"></div>
              <span>
                {formData.content_type === 'document' ? 'Uploading document...' : 'Adding content...'}
              </span>
            </div>
          )}

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
              disabled={loading || !formData.title.trim() || (formData.content_type === 'document' && !documentFile)}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  {formData.content_type === 'document' ? 'Uploading...' : 'Adding...'}
                </>
              ) : (
                `📚 Add ${formData.content_type === 'document' ? 'Document' : 'Content'}`
              )}
            </button>
          </div>

          <div className="upload-tips">
            <h4>💡 Upload Tips:</h4>
            <ul>
              <li>Use descriptive titles for better organization</li>
              <li>PDF format is recommended for documents</li>
              <li>Keep file sizes under 50MB for faster uploads</li>
              <li>Add clear descriptions to help students understand the content</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;