import React from 'react';

const DocumentViewer = ({ documentUrl, title, onClose }) => {
  const getDocumentEmbedUrl = (url) => {
    if (url.includes('cloudinary.com')) {
      // For Cloudinary documents, we can use their viewer
      return url.replace('/upload/', '/upload/fl_attachment/');
    }
    
    // For other documents, try to use Google Docs viewer
    if (url.includes('.pdf')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    
    return url;
  };

  const handleDownload = () => {
    window.open(documentUrl, '_blank');
  };

  const getFileType = (url) => {
    if (url.includes('.pdf')) return 'PDF Document';
    if (url.includes('.doc') || url.includes('.docx')) return 'Word Document';
    if (url.includes('.ppt') || url.includes('.pptx')) return 'PowerPoint';
    if (url.includes('.xls') || url.includes('.xlsx')) return 'Excel Spreadsheet';
    if (url.includes('.txt')) return 'Text File';
    return 'Document';
  };

  return (
    <div className="document-viewer-modal">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content document-viewer" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📄 {title}</h2>
            <div className="document-actions">
              <button className="btn btn-outline btn-sm" onClick={handleDownload}>
                📥 Download
              </button>
              <button className="close-button" onClick={onClose}>×</button>
            </div>
          </div>

          <div className="document-content">
            <div className="document-info">
              <span className="file-type">File Type: {getFileType(documentUrl)}</span>
              <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="external-link">
                🔗 Open in new tab
              </a>
            </div>

            <div className="document-preview">
              {documentUrl.includes('.pdf') ? (
                <iframe
                  src={getDocumentEmbedUrl(documentUrl)}
                  title={title}
                  width="100%"
                  height="600px"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="unsupported-preview">
                  <div className="unsupported-icon">📄</div>
                  <h3>Document Preview Not Available</h3>
                  <p>This document type cannot be previewed in the browser.</p>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    📥 Download to View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;