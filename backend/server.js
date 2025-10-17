const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE SETUP ==========
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== BASIC ROUTES (TEST FIRST) ==========
app.get('/', (req, res) => {
  res.json({
    message: '🚀 LearnHub LMS API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      courses: '/api/courses/*',
      assignments: '/api/assignments/*',
      forum: '/api/forum/*',
      notifications: '/api/notifications/*',
      videos: '/api/videos/*',
      documents: '/api/documents/*',
      blogs: '/api/blogs/*'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ Server is healthy and running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// ========== DATABASE INITIALIZATION ==========
const initializeDatabase = async () => {
  try {
    const { initDatabase } = require('./config/database');
    await initDatabase();
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

// ========== ROUTE IMPORTS WITH ERROR HANDLING ==========
// ========== ROUTE IMPORTS WITH ERROR HANDLING ==========
const loadRoutes = () => {
  try {
    console.log('🔄 Loading routes...');
    
    // Import routes
    const authRoutes = require('./routes/auth');
    const courseRoutes = require('./routes/courses');
    const assignmentRoutes = require('./routes/assignments');
    const notificationRoutes = require('./routes/notifications');
    const blogRoutes = require('./routes/blogs');
    const forumRoutes = require('./routes/forum');

    // Use the routes with proper base paths
    app.use('/api/auth', authRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/assignments', assignmentRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/blogs', blogRoutes);
    app.use('/api/forum', forumRoutes); // FIXED: Added forum routes
    
    console.log('✅ Main routes loaded successfully');
    
    // Log all available routes
    console.log('\n📚 Available API Endpoints:');
    console.log('   🔐 AUTH');
    console.log('     POST /api/auth/register');
    console.log('     POST /api/auth/login');
    console.log('     GET  /api/auth/me');
    console.log('     GET  /api/auth/test');
    
    console.log('   📚 COURSES');
    console.log('     GET  /api/courses');
    console.log('     POST /api/courses');
    console.log('     GET  /api/courses/:courseId');
    console.log('     GET  /api/courses/teacher/my-courses');
    console.log('     GET  /api/courses/student/my-courses');
    console.log('     POST /api/courses/:courseId/enroll');
    
    console.log('   💬 FORUM');
    console.log('     GET  /api/forum/course/:courseId');
    console.log('     GET  /api/forum/category/:categoryId/threads');
    console.log('     POST /api/forum/category/:categoryId/threads');
    console.log('     GET  /api/forum/thread/:threadId');
    console.log('     GET  /api/forum/course/:courseId/search');
    
    console.log('   📝 BLOGS');
    console.log('     GET  /api/blogs');
    console.log('     POST /api/blogs');
    console.log('     GET  /api/blogs/:id');
    
    return true;
  } catch (error) {
    console.error('❌ Error loading main routes:', error.message);
    console.error(error.stack);
    return false;
  }
};
const loadVideoRoutes = () => {
  try {
    // Only load video routes if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠️ Cloudinary not configured - video routes disabled');
      return false;
    }
    const videoRoutes = require('./routes/videos');
    app.use('/api/videos', videoRoutes);
    console.log('✅ Video routes loaded successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Video routes not loaded:', error.message);
    return false;
  }
};

const loadDocumentRoutes = () => {
  try {
    // Only load document routes if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠️ Cloudinary not configured - document routes disabled');
      return false;
    }
    const documentRoutes = require('./routes/documents');
    app.use('/api/documents', documentRoutes);
    console.log('✅ Document routes loaded successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Document routes not loaded:', error.message);
    return false;
  }
};

// ========== BASIC TEST ROUTE ==========
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working!',
    timestamp: new Date().toISOString()
  });
});

// ========== SERVER STARTUP ==========
const startServer = async () => {
  console.log('🚀 Starting LearnHub LMS Server...');
  console.log('📁 Current directory:', __dirname);
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('🗄️  Database:', process.env.DB_NAME || 'lms_db');
  console.log('☁️  Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured');
  
  // Initialize database
  const dbReady = await initializeDatabase();
  if (!dbReady) {
    console.log('⚠️ Starting server without database connection');
  }
  
  // Load routes
  const routesReady = loadRoutes();
  const videoRoutesReady = loadVideoRoutes();
  const documentRoutesReady = loadDocumentRoutes();
  
  if (!routesReady) {
    console.log('⚠️ Some routes failed to load, but server will continue');
  }

  // ========== 404 HANDLER (MUST BE AFTER ALL ROUTES) ==========
// ========== 404 HANDLER (MUST BE AFTER ALL ROUTES) ==========
 app.use('*', (req, res) => {
   console.log('🔴 404 - Endpoint not found:', req.originalUrl);
  
   res.status(404).json({
     success: false,
     message: '❌ Endpoint not found',
     path: req.originalUrl,
     method: req.method,
     availableEndpoints: [
       'GET  /',
       'GET  /api/health',
       'GET  /api/test',
       'POST /api/auth/register',
       'POST /api/auth/login',
       'GET  /api/auth/me',
       'GET  /api/auth/test',
       'GET  /api/courses',
       'POST /api/courses',
       'GET  /api/courses/:id',
       'GET  /api/courses/teacher/my-courses',
       'GET  /api/courses/student/my-courses',
       'POST /api/courses/:courseId/enroll',
      // ADD ASSIGNMENTS ENDPOINTS
       'POST /api/assignments/courses/:courseId/assignments',
       'GET  /api/assignments/courses/:courseId/assignments',
       'GET  /api/assignments/student/assignments',
       'GET  /api/assignments/student/courses/:courseId/assignments',
       'POST /api/assignments/assignments/:assignmentId/submit',
       'GET  /api/assignments/assignments/:assignmentId/submissions',
       'GET  /api/assignments/student/submissions',
       'POST /api/assignments/submissions/:submissionId/grade',
       'GET  /api/assignments/student/grades',
      // OTHER ENDPOINTS
       'GET  /api/blogs',
       'POST /api/blogs'
     ],
     timestamp: new Date().toISOString()
   });
 });

  // ========== ERROR HANDLER (MUST BE LAST) ==========
  app.use((err, req, res, next) => {
    console.error('🚨 Server Error:', err.stack);
    
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
      timestamp: new Date().toISOString()
    });
  });
  
  // Start server
  app.listen(PORT, () => {
    console.log('\n✨ ========== SERVER STARTED SUCCESSFULLY ========== ✨');
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`✅ Test Route: http://localhost:${PORT}/api/test`);
    console.log(`🔐 Auth Test: http://localhost:${PORT}/api/auth/test`);
    console.log('\n🔧 Server is ready to handle requests!');
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});

module.exports = app;