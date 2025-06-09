import React, { useEffect, useState } from 'react';

const Home = () => {
  // Navigation handlers (replace with your actual navigation logic)
  const handleLogin = () => {
  window.location.href = '/login';};
  
  const handleRegister = () => {
  window.location.href = '/register';};

  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

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
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => observer.observe(el));

    return () => {
      clearInterval(interval);
      if (observer) {
        animateElements.forEach(el => observer.unobserve(el));
      }
    };
  }, [mockupSlides.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-xl z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                READY-O-METER
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('demo')}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                Demo
              </button>
              <button 
                onClick={() => scrollToSection('tech')}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                Technology
              </button>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={handleLogin}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={handleRegister}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-gray-600 hover:text-blue-600 font-medium w-full text-left">Home</button>
                <button onClick={() => scrollToSection('features')} className="block px-3 py-2 text-gray-600 hover:text-blue-600 font-medium w-full text-left">Features</button>
                <button onClick={() => scrollToSection('how-it-works')} className="block px-3 py-2 text-gray-600 hover:text-blue-600 font-medium w-full text-left">How It Works</button>
                <button onClick={() => scrollToSection('demo')} className="block px-3 py-2 text-gray-600 hover:text-blue-600 font-medium w-full text-left">Demo</button>
                <button onClick={() => scrollToSection('tech')} className="block px-3 py-2 text-gray-600 hover:text-blue-600 font-medium w-full text-left">Technology</button>
                <div className="border-t border-gray-100 pt-2 space-y-2">
                  <button onClick={handleLogin} className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium w-full text-left">Sign In</button>
                  <button onClick={handleRegister} className="block px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium w-full text-left">Get Started</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8 animate-on-scroll">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full px-4 py-2 text-sm font-medium text-purple-700">
                <span>✨</span>
                <span>AI-Powered Learning Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform PDFs into
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
                  Interactive Quizzes
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                Upload your documents and let our advanced AI create personalized quizzes instantly. 
                Perfect for students, educators, and professionals looking to enhance their learning experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleRegister}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Start Creating Quizzes</span>
                  <span>→</span>
                </button>
                <button 
                  onClick={() => scrollToSection('demo')}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300"
                >
                  View Demo
                </button>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="animate-on-scroll perspective-1000">
              <div className="relative transform hover:rotate-y-2 transition-transform duration-500">
                {/* Browser Frame */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Browser Header */}
                  <div className="bg-gray-700 px-4 py-3 flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-gray-600 rounded-lg px-4 py-1 text-center text-gray-300 text-sm">
                      readyo-meter.app/dashboard
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="bg-gray-900 h-96 relative">
                    {/* Slideshow */}
                    <div className="absolute inset-0">
                      {mockupSlides.map((slide, index) => (
                        <div 
                          key={index}
                          className={`absolute inset-0 transition-opacity duration-500 flex items-center justify-center ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <div className="text-center text-white p-8">
                            <div className="text-6xl mb-4">
                              {slide.image === 'quiz-upload' && '📁'}
                              {slide.image === 'quiz-generation' && '🤖'}
                              {slide.image === 'quiz-interface' && '❓'}
                              {slide.image === 'quiz-analytics' && '📊'}
                            </div>
                            <h4 className="text-xl font-semibold mb-2 text-yellow-400">{slide.title}</h4>
                            <p className="text-gray-300">{slide.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {mockupSlides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentSlide 
                              ? 'bg-yellow-400 scale-125' 
                              : 'bg-gray-500 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20 -z-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/10 text-3xl animate-bounce animation-delay-1000">📚</div>
          <div className="absolute top-3/5 right-1/5 text-2xl animate-bounce animation-delay-2000">💡</div>
          <div className="absolute top-1/3 right-1/4 text-2xl animate-bounce animation-delay-3000">⚡</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience next-generation learning with our AI-powered platform designed for modern education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "🤖",
                title: "Smart AI Engine",
                description: "Advanced natural language processing creates contextually relevant questions from any PDF content."
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Process documents and generate quizzes in seconds, not hours. Powered by FastAPI for optimal performance."
              },
              {
                icon: "📊",
                title: "Rich Analytics",
                description: "Detailed insights into your learning progress with performance tracking and improvement suggestions."
              },
              {
                icon: "🎯",
                title: "Instant Feedback",
                description: "Get immediate explanations for answers to reinforce learning and understand concepts better."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="animate-on-scroll bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-2 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and effective - get started in three easy steps</p>
          </div>
          
          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 transform -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
              {[
                {
                  step: "1",
                  title: "Upload PDF",
                  description: "Simply drag and drop your PDF document or click to browse and upload your learning materials."
                },
                {
                  step: "2", 
                  title: "AI Processing",
                  description: "Our advanced AI analyzes the content and generates relevant, engaging quiz questions automatically."
                },
                {
                  step: "3",
                  title: "Take Quiz",
                  description: "Start your interactive quiz with instant feedback, detailed explanations, and progress tracking."
                }
              ].map((item, index) => (
                <div key={index} className="text-center animate-on-scroll relative">
                  <div className="relative inline-block mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                      {item.step}
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-20"></div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See It In Action</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of Readyo-Meter with our interactive demo. Upload a sample PDF and see how our AI generates quizzes in real-time.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 lg:p-12 animate-on-scroll">
            <div className="text-center">
              <div className="inline-flex items-center space-x-4 bg-white rounded-2xl p-6 shadow-lg mb-8">
                <div className="text-4xl">🚀</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Interactive Demo Coming Soon</h3>
                  <p className="text-gray-600">Try our AI-powered PDF to quiz conversion with real-time processing</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { title: "Sample PDF Upload", icon: "📄" },
                  { title: "AI Question Generation", icon: "🧠" },
                  { title: "Interactive Quiz", icon: "🎯" }
                ].map((demo, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-3xl mb-3">{demo.icon}</div>
                    <h4 className="font-semibold text-gray-900">{demo.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Section */}
      <section id="tech" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl font-bold text-white mb-4">Built With Modern Technology</h2>
            <p className="text-xl text-gray-300">Powered by cutting-edge tools and frameworks for optimal performance</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { icon: "⚛️", name: "React", desc: "Modern UI" },
              { icon: "🔥", name: "FastAPI", desc: "High Performance" },
              { icon: "🧠", name: "OpenAI", desc: "Advanced AI" },
              { icon: "🗄️", name: "PostgreSQL", desc: "Reliable Database" }
            ].map((tech, index) => (
              <div key={index} className="text-center animate-on-scroll group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">{tech.name}</h4>
                <p className="text-gray-400">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 animate-on-scroll">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join us in revolutionizing education with AI-powered technology and create smarter quizzes today
          </p>
          <button 
            onClick={handleRegister}
            className="bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:-translate-y-1 transition-all duration-300 shadow-xl"
          >
            Get Started Free Today
          </button>
        </div>
      </section>

      {/* Custom Styles for Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .rotate-y-2 {
          transform: rotateY(2deg);
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;