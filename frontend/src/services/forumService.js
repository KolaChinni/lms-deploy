import api from './api';

export const forumService = {
  // Course forum
  async getCourseForum(courseId) {
    const response = await api.get(`/forum/course/${courseId}`);
    return response.data;
  },

  // Threads
  async getThreadsByCategory(categoryId, page = 1, limit = 20) {
    const response = await api.get(`/forum/category/${categoryId}/threads`, {
      params: { page, limit }
    });
    return response.data;
  },

  async createThread(categoryId, threadData) {
    const response = await api.post(`/forum/category/${categoryId}/threads`, threadData);
    return response.data;
  },

  async getThread(threadId) {
    const response = await api.get(`/forum/thread/${threadId}`);
    return response.data;
  },

  // Posts (replies)
  async createPost(threadId, postData) {
    const response = await api.post(`/forum/thread/${threadId}/posts`, postData);
    return response.data;
  },

  // Reactions
  async addReaction(postId, reactionType) {
    const response = await api.post(`/forum/post/${postId}/reactions`, { reaction_type: reactionType });
    return response.data;
  },

  async removeReaction(postId) {
    const response = await api.delete(`/forum/post/${postId}/reactions`);
    return response.data;
  },

  // Search
  async searchThreads(courseId, query) {
    const response = await api.get(`/forum/course/${courseId}/search`, {
      params: { q: query }
    });
    return response.data;
  },

  // Teacher actions
  async pinThread(threadId, pinned = true) {
    const response = await api.patch(`/forum/thread/${threadId}/pin`, { pinned });
    return response.data;
  },

  async lockThread(threadId, locked = true) {
    const response = await api.patch(`/forum/thread/${threadId}/lock`, { locked });
    return response.data;
  },

  async markAsAnswer(postId, isAnswer = true) {
    const response = await api.patch(`/forum/post/${postId}/answer`, { is_answer: isAnswer });
    return response.data;
  }
};

export default forumService;