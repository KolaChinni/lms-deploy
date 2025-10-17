-- PostgreSQL version for Render with your actual data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  otp_code VARCHAR(6) NULL,
  otp_expires TIMESTAMPTZ NULL,
  login_attempts INT DEFAULT 0,
  account_locked_until TIMESTAMPTZ NULL
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(100),
  teacher_id INT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create course_content table
CREATE TABLE IF NOT EXISTS course_content (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL DEFAULT 'video',
  video_url VARCHAR(500),
  video_public_id VARCHAR(255),
  video_duration INT,
  document_url VARCHAR(500),
  document_public_id VARCHAR(255),
  duration INT DEFAULT 0,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NULL,
  max_points INT NOT NULL DEFAULT 100,
  assignment_type VARCHAR(50) DEFAULT 'assignment',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT,
  file_url VARCHAR(500),
  file_public_id VARCHAR(255),
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'submitted',
  grade DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ NULL,
  graded_by INT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (assignment_id, student_id)
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  progress_percentage INT DEFAULT 0,
  completed_at TIMESTAMPTZ NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE (student_id, course_id)
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  content_id INT NOT NULL,
  progress_percentage INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  last_position INT DEFAULT 0,
  total_time_watched INT DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES course_content(id) ON DELETE CASCADE,
  UNIQUE (student_id, content_id)
);

-- Create other tables (empty for now)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  related_entity VARCHAR(50) NULL,
  related_entity_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_categories (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id SERIAL PRIMARY KEY,
  thread_id INT NOT NULL,
  author_id INT NOT NULL,
  content TEXT NOT NULL,
  parent_id INT NULL,
  is_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES forum_posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_reactions (
  id SERIAL PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  reaction_type VARCHAR(50) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (post_id, user_id, reaction_type),
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- INSERT YOUR ACTUAL DATA
INSERT INTO users (id, name, email, password, role, is_verified, created_at, updated_at) VALUES
(1, 'KOLA VENKATA SAI PUTRAYYA', 'k.v.s.putrayya@gmail.com', '$2a$12$I6lBU5n0WS8q5P2doPxmRestB83ypMb7YJBgmPoA.6nlvD6rQOgNO', 'teacher', FALSE, '2025-10-17 13:51:47', '2025-10-17 13:51:47'),
(2, 'KOLA VENKATA SAI PUTRAYYA', 'test7@gmail.com', '$2a$12$64wotlkiHoJTghFwLVszVuOZjiZhm/hl6JNmVK8BO2/AW0x/kAN56', 'student', FALSE, '2025-10-17 13:55:57', '2025-10-17 13:55:57');

INSERT INTO courses (id, title, description, duration, teacher_id, is_published, created_at, updated_at) VALUES
(1, 'Om sree Ganesha', 'Testing the site for deployment.', 'self', 1, TRUE, '2025-10-17 13:52:46', '2025-10-17 13:52:46');

INSERT INTO course_content (id, course_id, title, description, content_type, video_url, video_public_id, video_duration, display_order, is_published, created_at, updated_at) VALUES
(1, 1, 'testing', 'nothing', 'video', 'https://res.cloudinary.com/dukadqoss/video/upload/v1760709227/lms/courses/videos/gq75dtzklu9whhkby2yh.mp4', 'lms/courses/videos/gq75dtzklu9whhkby2yh', 5, 1, TRUE, '2025-10-17 13:53:44', '2025-10-17 13:53:44');

INSERT INTO assignments (id, course_id, title, description, due_date, max_points, assignment_type, created_at, updated_at) VALUES
(1, 1, 'assignment- 1', 'whatis your name?', '2025-10-18 13:55:00', 100, 'assignment', '2025-10-17 13:55:16', '2025-10-17 13:55:16');

INSERT INTO enrollments (id, student_id, course_id, enrolled_at, progress_percentage) VALUES
(1, 2, 1, '2025-10-17 13:56:04', 0);

INSERT INTO submissions (id, assignment_id, student_id, submission_text, submitted_at, grade, feedback, graded_at, graded_by, status) VALUES
(1, 1, 2, 'kvsputrayya', '2025-10-17 19:26:52', 99.00, 'good', '2025-10-17 19:28:38', 1, 'graded');

-- Create indexes
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_teacher_id ON courses(teacher_id);
CREATE INDEX idx_published ON courses(is_published);
CREATE INDEX idx_course_id ON course_content(course_id);
CREATE INDEX idx_content_type ON course_content(content_type);
CREATE INDEX idx_display_order ON course_content(display_order);
CREATE INDEX idx_course_id_assign ON assignments(course_id);
CREATE INDEX idx_due_date ON assignments(due_date);
CREATE INDEX idx_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_student_id_sub ON submissions(student_id);
CREATE INDEX idx_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_student_id_enroll ON enrollments(student_id);
CREATE INDEX idx_course_id_enroll ON enrollments(course_id);
CREATE INDEX idx_student_course ON student_progress(student_id, course_id);
CREATE INDEX idx_content ON student_progress(content_id);
CREATE INDEX idx_user_id_notif ON notifications(user_id);
CREATE INDEX idx_is_read ON notifications(is_read);
CREATE INDEX idx_created_at_notif ON notifications(created_at);
CREATE INDEX idx_course_id_cat ON forum_categories(course_id);
CREATE INDEX idx_category_id ON forum_threads(category_id);
CREATE INDEX idx_author_id_thread ON forum_threads(author_id);
CREATE INDEX idx_pinned ON forum_threads(is_pinned);
CREATE INDEX idx_last_reply ON forum_threads(last_reply_at);
CREATE INDEX idx_thread_id ON forum_posts(thread_id);
CREATE INDEX idx_author_id_post ON forum_posts(author_id);
CREATE INDEX idx_parent_id ON forum_posts(parent_id);
CREATE INDEX idx_post_id ON forum_reactions(post_id);
CREATE INDEX idx_user_id_react ON forum_reactions(user_id);

-- Reset sequences to continue from correct values
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('course_content_id_seq', (SELECT MAX(id) FROM course_content));
SELECT setval('assignments_id_seq', (SELECT MAX(id) FROM assignments));
SELECT setval('submissions_id_seq', (SELECT MAX(id) FROM submissions));
SELECT setval('enrollments_id_seq', (SELECT MAX(id) FROM enrollments));
SELECT setval('student_progress_id_seq', (SELECT MAX(id) FROM student_progress));
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
SELECT setval('forum_categories_id_seq', (SELECT MAX(id) FROM forum_categories));
SELECT setval('forum_threads_id_seq', (SELECT MAX(id) FROM forum_threads));
SELECT setval('forum_posts_id_seq', (SELECT MAX(id) FROM forum_posts));
SELECT setval('forum_reactions_id_seq', (SELECT MAX(id) FROM forum_reactions));
