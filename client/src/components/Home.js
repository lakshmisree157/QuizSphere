import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//calll the home.csss
import './Home.css'; // Ensure you have the correct path to your CSS file


const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const mockupSlides = [
    {
      title: "Upload & Process PDFs",
      description: "Drag and drop your documents for instant AI analysis",
      image: "quiz-upload"
    },
    {
      title: "AI-Generated Questions",
      description: "Smart algorithms create relevant quiz questions",
      image: "quiz-generation"
    },
    {
      title: "Interactive Quiz Interface",
      description: "Clean, intuitive design for seamless learning",
      image: "quiz-interface"
    },
    {
      title: "Detailed Analytics",
      description: "Track performance with comprehensive insights",
      image: "quiz-analytics"
    }
  ];

  useEffect(() => {
    // Auto-rotate slideshow
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockupSlides.length);
    }, 4000);

    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.fade-in, .slide-up');
    animateElements.forEach(el => observer.observe(el));

    // Smooth parallax on scroll
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const heroElements = document.querySelectorAll('.parallax-element');
      heroElements.forEach((element, index) => {
        const speed = 0.2 + (index * 0.1);
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      animateElements.forEach(el => observer.unobserve(el));
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mockupSlides.length]);

  return (
    <div className="landing-page">
         {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">🧠</span>
            <span className="brand-text">QuizAI</span>
          </div>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="nav-btn nav-btn-primary" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge fade-in">
                <span className="badge-icon">✨</span>
                AI-Powered Learning Platform
              </div>
              <h1 className="hero-title fade-in">
                Transform PDFs into
                <span className="gradient-text"> Interactive Quizzes</span>
              </h1>
              <p className="hero-description fade-in">
                Upload your documents and let our advanced AI create personalized 
                quizzes instantly. Perfect for students, educators, and professionals 
                looking to enhance their learning experience.
              </p>
              <div className="hero-cta fade-in">
                <button 
                  className="cta-primary" 
                  onClick={() => navigate('/register')}
                >
                  Start Creating Quizzes
                  <span className="cta-arrow">→</span>
                </button>
                <button 
                  className="cta-secondary" 
                  onClick={() => document.querySelector('.demo-section').scrollIntoView({behavior: 'smooth'})}
                >
                  View Demo
                </button>
              </div>
            </div>
            
            <div className="hero-mockup fade-in">
              <div className="mockup-container">
                <div className="browser-frame">
                  <div className="browser-header">
                    <div className="browser-buttons">
                      <span className="btn-close"></span>
                      <span className="btn-minimize"></span>
                      <span className="btn-maximize"></span>
                    </div>
                    <div className="browser-url">quizai.app/dashboard</div>
                  </div>
                  <div className="browser-content">
                    <div className="mockup-slideshow">
                      {mockupSlides.map((slide, index) => (
                        <div 
                          key={index}
                          className={`mockup-slide ${index === currentSlide ? 'active' : ''}`}
                        >
                          <div className="mockup-placeholder">
                            <div className="placeholder-icon">
                              {slide.image === 'quiz-upload' && '📁'}
                              {slide.image === 'quiz-generation' && '🤖'}
                              {slide.image === 'quiz-interface' && '❓'}
                              {slide.image === 'quiz-analytics' && '📊'}
                            </div>
                            <h4>{slide.title}</h4>
                            <p>{slide.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="slideshow-indicators">
                      {mockupSlides.map((_, index) => (
                        <button
                          key={index}
                          className={`indicator ${index === currentSlide ? 'active' : ''}`}
                          onClick={() => setCurrentSlide(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mockup-glow"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="float-element parallax-element" style={{top: '20%', left: '10%'}}>📚</div>
          <div className="float-element parallax-element" style={{top: '60%', right: '15%'}}>💡</div>
          <div className="float-element parallax-element" style={{top: '30%', right: '25%'}}>⚡</div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title slide-up">How It Works</h2>
          <div className="steps-container">
            <div className="step-item slide-up">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Upload PDF</h3>
                <p>Simply drag and drop your PDF document or click to browse and upload.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item slide-up">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Processing</h3>
                <p>Our AI analyzes the content and generates relevant quiz questions automatically.</p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item slide-up">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Take Quiz</h3>
                <p>Start your interactive quiz with instant feedback and detailed explanations.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title slide-up">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card slide-up">
              <div className="feature-icon">🤖</div>
              <h3>Smart AI Engine</h3>
              <p>Advanced natural language processing creates contextually relevant questions from any PDF content.</p>
            </div>
            <div className="feature-card slide-up">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Process documents and generate quizzes in seconds, not hours. Powered by FastAPI for optimal performance.</p>
            </div>
            <div className="feature-card slide-up">
              <div className="feature-icon">📊</div>
              <h3>Rich Analytics</h3>
              <p>Detailed insights into your learning progress with performance tracking and improvement suggestions.</p>
            </div>
            <div className="feature-card slide-up">
              <div className="feature-icon">🎯</div>
              <h3>Instant Feedback</h3>
              <p>Get immediate explanations for answers to reinforce learning and understand concepts better.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section Placeholder */}
      <section className="demo-section">
        <div className="container">
          <h2 className="section-title slide-up">See It In Action</h2>
            <p className="demo-description slide-up">
                Experience the power of QuizAI with our interactive demo. Upload a sample PDF and see how our AI generates quizzes in real-time.
                </p>
          <div className="demo-placeholder slide-up">
            <div className="demo-mockup">
              <h3>Interactive Demo Coming Soon</h3>
              <p>Try our AI-powered PDF to quiz conversion with real-time processing</p>
              <div className="demo-screens">
                <div className="demo-screen">Sample PDF Upload</div>
                <div className="demo-screen">AI Question Generation</div>
                <div className="demo-screen">Interactive Quiz</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Section */}
      <section className="tech-section">
        <div className="container">
          <h2 className="section-title slide-up">Built With Modern Technology</h2>
          <div className="tech-grid">
            <div className="tech-item slide-up">
              <div className="tech-icon">⚛️</div>
              <h4>React</h4>
              <p>Modern UI</p>
            </div>
            <div className="tech-item slide-up">
              <div className="tech-icon">🔥</div>
              <h4>FastAPI</h4>
              <p>High Performance</p>
            </div>
            <div className="tech-item slide-up">
              <div className="tech-icon">🧠</div>
              <h4>OpenAI</h4>
              <p>Advanced AI</p>
            </div>
            <div className="tech-item slide-up">
              <div className="tech-icon">🗄️</div>
              <h4>PostgreSQL</h4>
              <p>Reliable Database</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-content slide-up">
            <h2>Ready to Transform Your Learning?</h2>
            <p>Join thousands of users who are already creating smarter quizzes with AI</p>
            <button 
              className="cta-final" 
              onClick={() => navigate('/register')}
            >
              Get Started Free Today
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;