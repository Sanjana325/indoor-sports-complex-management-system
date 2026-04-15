import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  SportsScore, 
  Groups, 
  ArrowForward,
  CreditCard,
  Schedule,
  TrendingUp,
  NotificationsActive,
  SportsTennis,
  School
} from "@mui/icons-material";
import playerService from "../../services/playerService";
import { formatLKR } from "../../utils/formatters";
import "../../styles/PlayerPortal.css";

const CARD_WIDTH = 304; 
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
  const [sports, setSports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [sportsData, bookingsData, classesData, paymentsData] = await Promise.all([
          playerService.getSports(),
          playerService.getMyBookings(),
          playerService.getMyClasses(),
          playerService.getMyPayments()
        ]);
        
        setSports(sportsData.sports || []);
        setBookings(bookingsData.bookings || []);
        setClasses(classesData.enrollments || []);
        setPayments(paymentsData.payments || []);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = bookings.filter(b => b.Date?.split('T')[0] === today).length;
    const activeClassesCount = classes.filter(c => c.EnrollmentStatus === 'ENROLLED').length;
    const pendingActions = payments.filter(p => p.Status === 'PENDING' && p.Method === 'BANK_SLIP' && !p.SlipPath).length;
    
    return { todaySessions, activeClassesCount, pendingActions };
  }, [bookings, classes, payments]);

  const maxOffset = Math.max(0, (sports.length - 1) * CARD_WIDTH);
  const slidePrev = () => setOffset(prev => Math.max(prev - CARD_WIDTH, 0));
  const slideNext = () => setOffset(prev => Math.min(prev + CARD_WIDTH, maxOffset));

  return (
    <div className="player-portal-home">
      {/* HERO Section - Asymmetrical Split */}
      <section className="hero-wrapper-elite">
        <div className="hero-content-left">
          <h1 className="hero-title-elite">Player Dashboard</h1>
          <p className="hero-subtitle-elite">
            Track your performance, manage bookings, and raise your game.
          </p>
        </div>

        <div className="hero-stats-right">
          <div className="stat-card-micro">
            <div className="stat-icon-wrap" style={{ background: 'rgba(5, 150, 105, 0.2)', color: '#10b981' }}>
              <TrendingUp fontSize="small" />
            </div>
            <div className="stat-info-wrap">
              <span className="stat-label">Active Classes</span>
              <span className="stat-value">{stats.activeClassesCount}</span>
            </div>
          </div>
          <div className="stat-card-micro">
            <div className="stat-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>
              <Schedule fontSize="small" />
            </div>
            <div className="stat-info-wrap">
              <span className="stat-label">Sessions Today</span>
              <span className="stat-value">{stats.todaySessions}</span>
            </div>
          </div>
          <div className="stat-card-micro">
            <div className="stat-icon-wrap" style={{ background: 'rgba(225, 29, 72, 0.2)', color: '#fb7185' }}>
              <NotificationsActive fontSize="small" className={stats.pendingActions > 0 ? "pt-pulse" : ""} />
            </div>
            <div className="stat-info-wrap">
              <span className="stat-label">Pending Actions</span>
              <span className="stat-value">{stats.pendingActions}</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS - Centered and Compacted */}
      <section className="player-quick-actions" style={{ marginTop: '-11rem', padding: '0 10%', gap: '2rem' }}>
        <div className="action-card action-card-primary" style={{ flex: 1, padding: '2rem 1.75rem' }}>
          <SportsScore className="action-card-ghost" style={{ fontSize: '8rem' }} />
          <div className="action-icon-wrap" style={{ background: '#0f172a', color: '#bef264', width: '60px', height: '60px' }}>
            <SportsTennis sx={{ fontSize: '2.2rem' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Book a Court</h2>
            <p style={{ color: 'var(--player-text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Reserve professional-grade arenas for practice.
            </p>
            <Link to="/player/book-court" className="pt-btn-primary" style={{ width: '100%', padding: '10px 20px', fontSize: '0.9rem' }}>
              Book Arena Now <ArrowForward fontSize="small" />
            </Link>
          </div>
        </div>

        <div className="action-card action-card-primary" style={{ flex: 1, padding: '2rem 1.75rem' }}>
          <Groups className="action-card-ghost" style={{ fontSize: '8rem' }} />
          <div className="action-icon-wrap" style={{ background: '#0f172a', color: '#bef264', width: '60px', height: '60px' }}>
            <School sx={{ fontSize: '2.2rem' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '6px' }}>Join a Class</h2>
            <p style={{ color: 'var(--player-text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Train with professional coaches in specialized sessions.
            </p>
            <Link to="/player/available-classes" className="pt-btn-primary" style={{ width: '100%', padding: '10px 20px', fontSize: '0.9rem' }}>
              Browse Training <ArrowForward fontSize="small" />
            </Link>
          </div>
        </div>
      </section>

      {/* SPORTS CAROUSEL */}
      <div className="sports-band-section" style={{ marginTop: '5rem' }}>
        <div className="sports-band-header">
          <h2 className="sports-band-title">Explore Your Arena</h2>
          <div className="carousel-controls">
            <button className="band-nav-btn" onClick={slidePrev} disabled={offset === 0} aria-label="Previous sport"><ChevronLeft /></button>
            <button className="band-nav-btn" onClick={slideNext} disabled={offset >= maxOffset} aria-label="Next sport"><ChevronRight /></button>
          </div>
        </div>
        
        <div className="sport-band-container">
          <div className="sport-band-wrapper" style={{ transform: `translateX(-${offset}px)` }}>
            {loading ? Array(4).fill(null).map((_, i) => (
              <div key={i} className="sport-card" style={{ height: 280, opacity: 0.5 }} />
            )) : sports.map(sport => (
              <div key={sport.SportID} className="sport-card" onClick={() => navigate(`/player/book-court?sportId=${sport.SportID}`)}>
                <img src={SPORT_IMAGES[sport.SportName] ?? "https://placeholder.com/800"} alt={sport.SportName} className="sport-card-img" />
                <div className="sport-card-content">
                  <h3 className="sport-card-name">{sport.SportName}</h3>
                  <p className="sport-card-price">Rs. <strong style={{ color: 'var(--player-primary)' }}>{Number(sport.BasePrice ?? 500).toLocaleString()}</strong> / hr</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}