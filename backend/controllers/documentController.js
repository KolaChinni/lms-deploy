const { cloudinary, uploadDocumentToCloudinary, deleteDocument } = require('../config/cloudinary');
const CourseContent = require('../models/CourseContent');
const fs = require('fs');

// Test connection
exports.testConnection = async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      message: 'Cloudinary connected successfully for documents!',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: result.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
};

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadDocumentToCloudinary(req.file.path);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    const documentData = {
      public_id: cloudinaryResult.public_id,
      secure_url: cloudinaryResult.secure_url,
      format: cloudinaryResult.format,
      resource_type: cloudinaryResult.resource_type,
      bytes: cloudinaryResult.bytes,
      original_filename: req.file.originalname
    };

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: documentData
    });

  } catch (error) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

// Add document content to course
exports.addDocumentContent = async (req, res) => {
  try {
    const { courseId, title, description, documentUrl, publicId, orderIndex } = req.body;

    if (!courseId || !title || !documentUrl || !publicId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const content = await CourseContent.create({
      course_id: courseId,
      title: title.trim(),
      description: description || '',
      content_type: 'document',
      document_url: documentUrl,
      document_public_id: publicId,
      order_index: orderIndex || 0,
      is_published: true
    });

    res.json({
      success: true,
      message: 'Document content added successfully',
      content: content
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add document content',
      error: error.message
    });
  }
};

// Delete document content
exports.deleteDocumentContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await CourseContent.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete from Cloudinary
    if (content.document_public_id) {
      await deleteDocument(content.document_public_id);
    }

    // Delete from database
    await CourseContent.delete(contentId);

    res.json({
      success: true,
      message: 'Document content deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete document content',
      error: error.message
    });
  }
};

// Get upload signature for direct uploads
exports.getUploadSignature = async (req, res) => {
  try {
    const { folder = 'lms/courses/documents' } = req.body;
    const timestamp = Math.round(Date.now() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate signature',
      error: error.message
    });
  }
};