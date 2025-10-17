import api from './api';

export const documentService = {
  // Upload document to Cloudinary
  async uploadDocument(documentFile) {
    try {
      const formData = new FormData();
      formData.append('document', documentFile);

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large files
      });

      return response.data;
    } catch (error) {
      console.error('Document upload error:', error);
      throw {
        type: 'UPLOAD_ERROR',
        message: error.response?.data?.message || 'Failed to upload document',
        suggestion: 'Please check your internet connection and try again.'
      };
    }
  },

  // Delete document from Cloudinary
  async deleteDocument(publicId) {
    try {
      const response = await api.delete(`/documents/content/${publicId}`);
      return response.data;
    } catch (error) {
      console.error('Delete document error:', error);
      throw {
        type: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete document',
        suggestion: 'Please try again.'
      };
    }
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file type icon
  getFileTypeIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📈';
    if (fileType.includes('text')) return '📃';
    return '📎';
  }
};

export default documentService;