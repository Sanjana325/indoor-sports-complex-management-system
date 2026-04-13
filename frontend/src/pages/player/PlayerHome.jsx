import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Schedule, ChevronLeft, ChevronRight, SportsScore, Groups, ArrowForward } from "@mui/icons-material";
import playerService from "../../services/playerService";
import "../../styles/PlayerPortal.css";

const SPORT_IMAGES = {
  "Football": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
  "Badminton": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
  "Cricket": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800",
  "Table Tennis": "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&q=80&w=800",
  "Chess": "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&q=80&w=800",
  "Basketball": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
};

export default function PlayerHome() {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    async function fetchSports() {
      try {
        const data = await playerService.getSports();
        setSports(data.sports || []);
      } catch (err) {
        console.error("Failed to load sports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSports();
  }, []);

  const nextSlide = () => {
    if (carouselIndex < sports.length - 1) setCarouselIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (carouselIndex > 0) setCarouselIndex(prev => prev - 1);
  };

  const carouselTransform = {
    transform: `translateX(-${carouselIndex * 324}px)` 
  };

  return (
    <div className="player-portal-home">
      
      {/* ELITE IMMERSIVE HERO */}
      <section className="hero-wrapper-elite">
        <h1 className="hero-title-elite">Welcome Back</h1>
        <p className="hero-subtitle-elite">
          Your premium destination for indoor sports and professional training. 
          Ready to raise your game today?
        </p>
      </section>

      {/* QUICK ACTIONS (Floating Grid) */}
      <section className="player-quick-actions">
        <Link to="/player/book-court" className="action-card">
          <div className="action-icon-wrap">
            <SportsScore sx={{ fontSize: '2.5rem' }} />
          </div>
          <div>
            <h2>Book a Court</h2>
            <p>Reserve exclusive slots for friendly matches or high-performance practice.</p>
            <div className="action-card-btn">
              Get Started <ArrowForward fontSize="small" />
            </div>
          </div>
        </Link>

        <Link to="/player/available-classes" className="action-card">
          <div className="action-icon-wrap">
            <Groups sx={{ fontSize: '2.5rem' }} />
          </div>
          <div>
            <h2>Join a Class</h2>
            <p>Master new skills with elite coaches in our specialized group sessions.</p>
            <div className="action-card-btn">
              Explore Classes <ArrowForward fontSize="small" />
            </div>
          </div>
        </Link>
      </section>

      {/* SPORTS CAROUSEL */}
      <div className="sports-band-section">
        <h2 className="sports-band-title">Explore Featured Sports</h2>
        
        <section className="sport-band-container">
          <button 
            className="band-nav-btn prev" 
            onClick={prevSlide}
            style={{ opacity: carouselIndex === 0 ? 0.3 : 1, pointerEvents: carouselIndex === 0 ? 'none' : 'auto' }}
          >
            <ChevronLeft />
          </button>

          <div className="sport-band-wrapper" style={carouselTransform}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: 'var(--player-text-muted)' }}>
                Preparing the arena...
              </div>
            ) : (
              sports.map((sport) => (
                <div 
                  key={sport.SportID} 
                  className="sport-card"
                  onClick={() => navigate(`/player/book-court?sportId=${sport.SportID}`)}
                >
                  <img 
                    src={SPORT_IMAGES[sport.SportName] || "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"} 
                    alt={sport.SportName} 
                    className="sport-card-img" 
                  />
                  <div className="sport-card-content">
                    <h3 className="sport-card-name">{sport.SportName}</h3>
                    <div className="sport-card-price">
                      Rs. <em>{Number(sport.BasePrice || 500).toLocaleString("en-LK")}</em> / hr
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            className="band-nav-btn next" 
            onClick={nextSlide}
            style={{ opacity: carouselIndex >= sports.length - 1 ? 0.3 : 1, pointerEvents: carouselIndex >= sports.length - 1 ? 'none' : 'auto' }}
          >
            <ChevronRight />
          </button>
        </section>
      </div>

      {/* QUICK OVERVIEW SECTION */}
      <section className="player-grid-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="glass-panel-light" style={{ borderLeft: '6px solid var(--player-primary)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <Schedule style={{ color: 'var(--player-primary)' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Member Essentials</h2>
             </div>
             <p style={{ color: 'var(--player-text-muted)', lineHeight: '1.8', fontSize: '1.1rem' }}>
                Use your personalized dashboard to manage court bookings, enroll in upcoming skill sessions, 
                and track payments. ArenaPro is dedicated to providing a seamless, high-performance experience 
                for every member of our sports community.
             </p>
          </div>
        </div>
      </section>

    </div>
  );
}