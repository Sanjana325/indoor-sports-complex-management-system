import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SportsTennis, 
  Groups, 
  Verified, 
  Map, 
  Phone, 
  Email, 
  ArrowForward,
  Star,
  EmojiEvents,
  AccessTime,
  School
} from '@mui/icons-material';
import '../styles/LandingPage.css';

// main point of entry for public users
export default function LandingPage() {
  // list of sports shown in the public gallery
  const sports = [
    { name: 'Badminton', img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800' },
    { name: 'Cricket', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800' },
    { name: 'Football', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' },
    { name: 'Karate', img: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800' },
    { name: 'Chess', img: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=800' },
    { name: 'Dancing', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800' }
  ];

  return (
    <div className="landing-container">
      {/* top navigation bar */}
      <nav className="lp-nav">
        <Link to="/" className="lp-brand">Arena<span>Pro</span></Link>
        <div className="lp-nav-actions">
          <Link to="/login" className="lp-btn-login">Sign In</Link>
          <Link to="/register" className="lp-btn-register">Sign Up</Link>
        </div>
      </nav>

      {/* main hero entrance section */}
      <header className="lp-hero">
        <div className="lp-hero-content">
          <span className="lp-hero-tag">Elite Sports arena</span>
          <h1 className="lp-hero-title">Elevate Your Game at ArenaPro</h1>
          <p className="lp-hero-subtitle">
            Experience world-class courts, expert coaching, and a professional sporting community in the heart of Kuliyapitiya. Your journey to excellence starts here.
          </p>
          <div className="lp-hero-btns">
            <Link to="/register" className="lp-btn-register" style={{ fontSize: '1.1rem', padding: '15px 40px' }}>
              Book Your Session
            </Link>
            <Link to="/login" className="lp-btn-login" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Sign in to book <ArrowForward fontSize="small" />
            </Link>
          </div>
        </div>

        {/* hero images stack with floating perspective effects */}
        <div className="lp-hero-visual">
          <div className="lp-visual-stack">
            <img 
              src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800" 
              alt="Cricket" 
              className="lp-stack-img back" 
            />
            <img 
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800" 
              alt="Badminton" 
              className="lp-stack-img middle" 
            />
            <img 
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800" 
              alt="Football" 
              className="lp-stack-img front" 
            />
          </div>
        </div>
      </header>

      {/* features list summarizing complex advantages */}
      <section id="about" className="lp-section">
        <h2 className="lp-section-title">Why Professionals Choose Us</h2>
        <div className="lp-about-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-icon"><Verified /></div>
            <h3 className="lp-feature-name">Elite Facilities</h3>
            <p className="lp-feature-desc">International standard flooring and lighting across all our courts to ensure peak performance and safety.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon"><School /></div>
            <h3 className="lp-feature-name">Pro Training</h3>
            <p className="lp-feature-desc">Join our structured coaching programs designed for all skill levels, led by certified national athletes.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon"><EmojiEvents /></div>
            <h3 className="lp-feature-name">Expert Coaching</h3>
            <p className="lp-feature-desc">Learn from certified professionals who have competed at national and international levels.</p>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon"><AccessTime /></div>
            <h3 className="lp-feature-name">Flexible Hours</h3>
            <p className="lp-feature-desc">Open 7 days a week with a seamless online booking system that works around your schedule.</p>
          </div>
        </div>
      </section>

      {/* sports gallery items displaying available disciplines */}
      <section className="lp-section lp-sports-section">
        <h2 className="lp-section-title" style={{ color: 'white' }}>Our Disciplines</h2>
        <div className="lp-sports-grid">
          {sports.map((sport, index) => (
            <div key={index} className="lp-sport-item">
              <img src={sport.img} alt={sport.name} className="lp-sport-img" />
              <div className="lp-sport-overlay">
                <h3 className="lp-sport-name">{sport.name}</h3>
                <Link to="/register" style={{ color: 'var(--lp-primary)', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Reserve Now <ArrowForward fontSize="small" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* contact information section for venue accessibility */}
      <section className="lp-section">
        <div className="lp-contact-grid">
          <div className="lp-contact-info">
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Get in Touch</h2>
            <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '3rem' }}>
              Have questions about our facilities or classes? Visit our complex or give us a call.
            </p>
            
            <div className="lp-info-item">
              <div className="lp-info-icon"><Map /></div>
              <div>
                <h4 style={{ margin: 0 }}>Location</h4>
                <p style={{ margin: 0, color: '#64748b' }}>197/51, Meegahakotuwa, Kuliyapitiya, Sri Lanka</p>
              </div>
            </div>

            <div className="lp-info-item">
              <div className="lp-info-icon"><Phone /></div>
              <div>
                <h4 style={{ margin: 0 }}>Phone</h4>
                <p style={{ margin: 0, color: '#64748b' }}>+94 37 123 4567</p>
              </div>
            </div>

            <div className="lp-info-item">
              <div className="lp-info-icon"><Email /></div>
              <div>
                <h4 style={{ margin: 0 }}>Email</h4>
                <p style={{ margin: 0, color: '#64748b' }}>contact@arenapro.lk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* page footer with quick navigation links */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div>
            <Link to="/" className="lp-footer-brand">Arena<span>Pro</span></Link>
            <p>Your ultimate destination for sports excellence. Join the most advanced indoor sports complex in Sri Lanka.</p>
          </div>
          <div className="lp-footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/login">Sign In</Link></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="lp-footer-links">
            <h4>Our Sports</h4>
            <ul>
              <li><a href="#">Badminton</a></li>
              <li><a href="#">Cricket</a></li>
              <li><a href="#">Football</a></li>
              <li><a href="#">Karate</a></li>
              <li><a href="#">Chess</a></li>
              <li><a href="#">Dancing</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} ArenaPro Sports Complex. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
