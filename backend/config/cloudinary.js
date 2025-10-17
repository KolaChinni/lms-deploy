const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
const configureCloudinary = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary environment variables not set - file uploads will be disabled');
    return false;
  }
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('✅ Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
  return true;
};

// Initialize Cloudinary
const cloudinaryInitialized = configureCloudinary();

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for video storage
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for document storage
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Video file filter
const videoFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

// Document file filter
const documentFileFilter = (req, file, cb) => {
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

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (PDF, Word, PowerPoint, Excel, Text)!'), false);
  }
};

// Video upload middleware
const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Document upload middleware
const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Upload video to Cloudinary
const uploadVideoToCloudinary = async (filePath) => {
  try {
    if (!cloudinaryInitialized) {
      throw new Error('Cloudinary not configured - check environment variables');
    }
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'lms/courses/videos'
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// Upload document to Cloudinary
const uploadDocumentToCloudinary = async (filePath) => {
  try {
    if (!cloudinaryInitialized) {
      throw new Error('Cloudinary not configured - check environment variables');
    }
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw', // Use 'raw' for documents
      folder: 'lms/courses/documents'
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// Delete video from Cloudinary
const deleteVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });
    return result;
  } catch (error) {
    throw error;
  }
};

// Delete document from Cloudinary
const deleteDocument = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  cloudinary,
  videoUpload,
  documentUpload,
  uploadVideoToCloudinary,
  uploadDocumentToCloudinary,
  deleteVideo,
  deleteDocument
};