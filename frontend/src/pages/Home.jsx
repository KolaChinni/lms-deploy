import React from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      {/* Space Video Background */}
      <video 
        autoPlay 
        muted 
        loop 
        className="space-video-background"
        poster="/videos/space-poster.jpg" // Optional poster frame
      >
        <source src="frontend\public\videos\228981_small.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Space Overlay with stars */}
      <div className="space-overlay"></div>
      
      {/* Shooting Stars */}
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>

      <div className="hero-section">
        <h1 className="hero-title">
          Welcome to  <span className="highlight">LearnIt </span> LMS
        </h1>
        <p className="hero-subtitle">
          Embark on an educational journey through the cosmos of knowledge. 
          Join our interstellar community of learners and educators.
        </p>
        
        {/* Space-themed CTA Section */}
        <div className="cta-section">
          <div className="cta-card">
            <h2>Launch Your Learning Journey</h2>
            <p>Begin your cosmic educational adventure today</p>
            
            <div className="cta-buttons">
              <button 
                className="cta-btn btn-primary"
                onClick={() => navigate('/register')}
              >
                <span className="btn-icon">🚀</span>
                Launch Free Account
              </button>
              
              <div className="login-options">
                <p>Already exploring with us?</p>
                <button 
                  className="cta-btn btn-outline"
                  onClick={() => navigate('/login')}
                >
                  <span className="btn-icon">🛸</span>
                  Board Your Ship
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Space Features Grid */}
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">🪐</div>
            <div className="feature-content">
              <h3>For Cosmic Learners</h3>
              <p>Navigate through galaxies of courses, track your orbit of progress, and collaborate with fellow space cadets.</p>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">👨‍🚀</div>
            <div className="feature-content">
              <h3>For Space Educators</h3>
              <p>Launch interactive learning missions, guide your crew of students, and provide stellar feedback across the cosmos.</p>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">🌌</div>
            <div className="feature-content">
              <h3>Light Speed Performance</h3>
              <p>Experience warp-speed learning with our advanced technology and 99.9% cosmic uptime guarantee.</p>
            </div>
          </div>
        </div>

        {/* Space Stats Section */}
        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Space Cadets</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Learning Planets</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Mission Success</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home