import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Schedule, ChevronLeft, ChevronRight, SportsScore, Groups, ArrowForward } from "@mui/icons-material";
import playerService from "../../services/playerService";
import "../../styles/PlayerPortal.css";

const CARD_WIDTH = 304; // 280px card + 24px gap

const SPORT_IMAGES = {
  "Football":     "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
  "Badminton":    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
  "Cricket":      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800",
  "Table Tennis": "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&q=80&w=800",
  "Chess":        "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&q=80&w=800",
  "Basketball":   "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
  "Swimming":     "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80&w=800",
  "Tennis":       "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&q=80&w=800",
};

export default function PlayerHome() {
  const navigate = useNavigate();
  const [sports, setSports]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [offset, setOffset]         = useState(0);   // px translateX value

  useEffect(() => {
    playerService.getSports()
      .then(data => setSports(data.sports || []))
      .catch(err => console.error("Failed to load sports:", err))
      .finally(() => setLoading(false));
  }, []);

  const maxOffset = Math.max(0, (sports.length - 1) * CARD_WIDTH);

  const slidePrev = () => setOffset(prev => Math.max(prev - CARD_WIDTH, 0));
  const slideNext = () => setOffset(prev => Math.min(prev + CARD_WIDTH, maxOffset));

  return (
    <div className="player-portal-home">

      {/* ── HERO ─────────────────────────────── */}
      <section className="hero-wrapper-elite">
        <h1 className="hero-title-elite">Welcome Back</h1>
        <p className="hero-subtitle-elite">
          Your premium destination for indoor sports and professional coaching.
          Ready to raise your game?
        </p>
      </section>

      {/* ── QUICK ACTIONS — cards straddle hero/stadium boundary ── */}
      <section className="player-quick-actions">
        <Link to="/player/book-court" className="action-card">
          <div className="action-icon-wrap">
            <SportsScore sx={{ fontSize: '2rem' }} />
          </div>
          <div>
            <h2>Book a Court</h2>
            <p>Reserve your slot for a competitive match or focused practice session.</p>
            <div className="action-card-btn">
              Book Now <ArrowForward fontSize="small" />
            </div>
          </div>
        </Link>

        <Link to="/player/available-classes" className="action-card">
          <div className="action-icon-wrap" style={{ background: '#f7fee7' }}>
            <Groups sx={{ fontSize: '2rem' }} />
          </div>
          <div>
            <h2>Join a Class</h2>
            <p>Train with expert coaches in specialized group sessions designed for every level.</p>
            <div className="action-card-btn">
              Explore Training <ArrowForward fontSize="small" />
            </div>
          </div>
        </Link>
      </section>

      {/* ── SPORTS CAROUSEL ─────────────────── */}
      <div className="sports-band-section">

        {/* Title + Controls side-by-side */}
        <div className="sports-band-header">
          <h2 className="sports-band-title">Explore Your Arena</h2>
          <div className="carousel-controls">
            <button
              className="band-nav-btn"
              onClick={slidePrev}
              disabled={offset === 0}
              aria-label="Previous sport"
            >
              <ChevronLeft />
            </button>
            <button
              className="band-nav-btn"
              onClick={slideNext}
              disabled={offset >= maxOffset}
              aria-label="Next sport"
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Scrolling track */}
        <div className="sport-band-container">
          <div
            className="sport-band-wrapper"
            style={{ transform: `translateX(-${offset}px)` }}
          >
            {loading
              ? Array(4).fill(null).map((_, i) => (
                  <div
                    key={i}
                    className="sport-card"
                    style={{ height: 280, background: '#f8fafc', border: 'none', boxShadow: 'none' }}
                  />
                ))
              : sports.map(sport => (
                  <div
                    key={sport.SportID}
                    className="sport-card"
                    onClick={() => navigate(`/player/book-court?sportId=${sport.SportID}`)}
                  >
                    <img
                      src={SPORT_IMAGES[sport.SportName] ?? "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"}
                      alt={sport.SportName}
                      className="sport-card-img"
                    />
                    <div className="sport-card-content">
                      <h3 className="sport-card-name">{sport.SportName}</h3>
                      <p className="sport-card-price">
                        Rs.&nbsp;
                        <strong style={{ color: 'var(--player-primary)' }}>
                          {Number(sport.BasePrice ?? 500).toLocaleString("en-LK")}
                        </strong>
                        &nbsp;/ hr
                      </p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE CENTER ───────────────── */}
      <section className="player-grid-section">
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="glass-panel-light" style={{ borderLeft: '6px solid var(--player-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <Schedule style={{ color: 'var(--player-primary)', fontSize: '2rem' }} />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--player-navy)', margin: 0 }}>
                Performance Center
              </h2>
            </div>
            <p style={{ color: 'var(--player-text-muted)', lineHeight: 1.8, fontSize: '1.05rem', maxWidth: 760 }}>
              Track your upcoming sessions, manage court bookings, and review professional
              training enrollments — all from your ArenaPro dashboard.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}