import api from './api'

export const courseService = {
  // Get all courses
  async getAllCourses() {
    const response = await api.get('/courses')
    return response // FIXED: Remove .data
  },

  // Create a new course (teacher only)
  async createCourse(courseData) {
    const response = await api.post('/courses', courseData)
    return response // FIXED: Remove .data
  },

  // Delete a course (teacher only)
  async deleteCourse(courseId) {
    const response = await api.delete(`/courses/${courseId}`)
    return response // FIXED: Remove .data
  },

  // Get teacher's courses
  async getTeacherCourses() {
    const response = await api.get('/courses/teacher/my-courses')
    return response // FIXED: Remove .data
  },

  // Get course details
  async getCourseDetails(courseId) {
    const response = await api.get(`/courses/${courseId}`)
    return response // FIXED: Remove .data
  },

  // Enroll in a course
  async enrollInCourse(courseId) {
    const response = await api.post(`/courses/${courseId}/enroll`)
    return response // FIXED: Remove .data
  },

  // Get student's enrolled courses
  async getStudentCourses() {
    const response = await api.get('/courses/student/my-courses')
    return response // FIXED: Remove .data
  },

  // Get course enrollments (teacher only)
  async getCourseEnrollments(courseId) {
    const response = await api.get(`/courses/${courseId}/enrollments`)
    return response // FIXED: Remove .data
  },

  // Add course content (teacher only)
  async addCourseContent(courseId, contentData) {
    const formData = new FormData()
    Object.keys(contentData).forEach(key => {
      formData.append(key, contentData[key])
    })
    
    const response = await api.post(`/courses/${courseId}/content`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response // FIXED: Remove .data
  },

  // Add video content via Cloudinary (teacher only)
  async addVideoContent(courseId, videoData) {
    const response = await api.post(`/courses/${courseId}/content/video`, videoData)
    return response // FIXED: Remove .data
  },

  // Get course videos
  async getCourseVideos(courseId) {
    const response = await api.get(`/courses/${courseId}/videos`)
    return response // FIXED: Remove .data
  },

  // Delete course content (teacher only)
  async deleteCourseContent(contentId) {
    const response = await api.delete(`/courses/content/${contentId}`)
    return response // FIXED: Remove .data
  },

  // Update video content (teacher only)
  async updateVideoContent(contentId, updateData) {
    const response = await api.put(`/courses/content/${contentId}/video`, updateData)
    return response // FIXED: Remove .data
  },

  // Get content statistics (teacher only)
  async getContentStats(courseId) {
    const response = await api.get(`/courses/${courseId}/content/stats`)
    return response // FIXED: Remove .data
  },

  // Get Cloudinary upload signature
  async getCloudinarySignature(folder = 'lms/courses/videos') {
    const response = await api.post('/courses/upload/signature', { folder })
    return response // FIXED: Remove .data
  },

  // Update progress
  async updateProgress(courseId, contentId, progressData) {
    const response = await api.post(`/courses/${courseId}/content/${contentId}/progress`, progressData)
    return response // FIXED: Remove .data
  },

  // Alias for getCourseDetails for consistency
  async getCourse(courseId) {
    return this.getCourseDetails(courseId)
  },

  // Get student progress
  async getStudentProgress() {
    const response = await api.get('/courses/student/progress')
    return response // FIXED: Remove .data
  },

  // Utility method to format video duration
  formatVideoDuration(seconds) {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Utility method to get video thumbnail (Cloudinary)
  getVideoThumbnail(videoUrl, width = 320, height = 180) {
    if (!videoUrl) return null;
    
    // For Cloudinary URLs, we can generate a thumbnail
    if (videoUrl.includes('cloudinary.com')) {
      // Replace upload type with image and add transformation
      return videoUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
    }
    
    return videoUrl; // Return original URL for non-Cloudinary videos
  },

  // Utility method to check if URL is from Cloudinary
  isCloudinaryUrl(url) {
    return url && url.includes('cloudinary.com');
  }
}
