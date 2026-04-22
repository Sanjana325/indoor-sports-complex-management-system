import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress, 
  Card, 
  CardContent, 
  Avatar, 
  Chip,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link
} from "@mui/material";
import { 
  Person, 
  Place, 
  ArrowBack,
  Payments,
  EventNote,
  School,
  ErrorOutline,
  SportsCricket,
  SportsTennis,
  SportsSoccer,
  SportsBasketball,
  SportsVolleyball,
  Verified,
  Info
} from "@mui/icons-material";
import CloseIcon from '@mui/icons-material/Close';
import "../../styles/PlayerMyClasses.css";
import ClassPaymentModal from "../../components/ClassPaymentModal";
import playerService from "../../services/playerService";

const ICON_MAP = {
  "Cricket": SportsCricket,
  "Badminton": SportsTennis,
  "Futsal": SportsSoccer,
  "Basketball": SportsBasketball,
  "Volleyball": SportsVolleyball,
};

const DEFAULT_ICON = SportsSoccer;
const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t) {
  if (!t) return "";
  const timeStr = String(t);
  return timeStr.includes(':') ? timeStr.slice(0, 5) : timeStr;
}

// helper to transform raw schedule data into a readable format for players
function formatScheduleDetailed(c) {
  const start = formatTime(c.StartTime);
  const end = formatTime(c.EndTime);
  const timeRange = start && end ? `${start} - ${end}` : (start || end || "");

  if (c.ScheduleType === "ONETIME") {
    return `One-Time | ${timeRange || "No time set"}`;
  }

  if (c.Weekdays) {
    try {
      const days = String(c.Weekdays).split(',')
        .map(d => {
          const idx = parseInt(d.trim());
          return !isNaN(idx) ? DAY_MAP[idx] : d;
        })
        .filter(d => d)
        .join(", ");
      return days ? `${days} | ${timeRange}` : timeRange;
    } catch (e) {
      console.error("[Format] Weekdays error:", e);
    }
  }
  
  return timeRange || "Schedule TBA";
}

function formatLKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK")}`;
}

// inventory page for players to see all sports classes they have currently joined
export default function PlayerMyClasses() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payClassData, setPayClassData] = useState(null);

  const [coachModalOpen, setCoachModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  // downloads the player enrollment list and payment status from the backend
  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const data = await playerService.getMyClasses();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  // sends a request to revoke the player's enrollment and stop billing
  const handleLeaveClass = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to leave this class? Recurring payments will be stopped.")) return;
    try {
      await playerService.leaveClass(enrollmentId);
      alert("Successfully left the class.");
      fetchMyClasses();
    } catch (err) {
      alert(err.response?.data?.message || "Error leaving class");
    }
  };

  // stores class info for the payment gateway popup
  const handlePayNow = (e, enrollment) => {
    e.stopPropagation();
    setPayClassData({
      ClassID: enrollment.ClassID,
      Title: enrollment.Title,
      Fee: enrollment.Fee
    });
    setPaymentModalOpen(true);
  };

  // formats coach profile data for the credential modal
  const handleSeeMoreCoach = (c) => {
    setSelectedCoach({
      name: `${c.CoachFirstName} ${c.CoachLastName}`,
      qualifications: c.CoachQualifications ? c.CoachQualifications.split(',') : []
    });
    setCoachModalOpen(true);
  };

  return (
    <div className="pmc-portal-container">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* top header for class management dashboard */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" className="pmc-title">
              My Classes
            </Typography>
            <Typography variant="h6" className="pmc-subtitle">
              Manage your enrollments and track your progress
            </Typography>
          </Box>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate("/player")}
            className="pbc-back-btn"
            sx={{ textTransform: 'none', px: 3 }}
          >
            Dashboard
          </Button>
        </Box>

        {/* shows loading spinner or grid of enrolled class cards */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: 'var(--primary)', mb: 2 }} />
            <Typography sx={{ color: 'var(--text-muted)' }}>Loading your classes...</Typography>
          </Box>
        ) : error ? (
           <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <ErrorOutline sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'var(--text-main)', fontWeight: 800 }}>Something went wrong</Typography>
              <Typography sx={{ color: 'var(--text-muted)' }}>{error}</Typography>
              <Button onClick={fetchMyClasses} sx={{ mt: 2, color: 'var(--primary)', fontWeight: 700 }}>Try Again</Button>
           </Box>
        ) : enrollments.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 12, 
            bgcolor: 'var(--bg-surface)', 
            borderRadius: '24px',
            border: '1px dashed var(--border-light)'
          }}>
            <School sx={{ fontSize: 64, color: 'var(--text-muted)', opacity: 0.2, mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'var(--text-main)', mb: 1, fontWeight: 800 }}>No enrolled classes yet</Typography>
            <Typography sx={{ color: 'var(--text-muted)' }}>Join a class to start your training journey at ArenaPro.</Typography>
            <Button 
                variant="contained" 
                onClick={() => navigate("/player/available-classes")}
                sx={{ mt: 3, bgcolor: 'var(--primary)', fontWeight: 700, borderRadius: '10px', px: 4 }}
            >
                Explore Classes
            </Button>
          </Box>
        ) : (
          /* grid layout of all sports classes the player has registered for */
          <Grid container spacing={3}>
            {enrollments.map((c) => {
              const IconComp = ICON_MAP[c.SportName] || DEFAULT_ICON;
              const isPaid = c.PaymentStatus === 'PAID';
              
              return (
                <Grid item xs={12} sm={6} md={4} key={c.EnrollmentID}>
                  <Card className="pmc-enrollment-card">
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography className="pmc-enrollment-id">
                          #ENR-{c.EnrollmentID}
                        </Typography>
                        <Chip 
                          label={c.PaymentStatus || "ACTIVE"}
                          className={`pmc-status-chip ${isPaid ? 'pmc-status-paid' : 'pmc-status-pending'}`}
                          size="small"
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Avatar sx={{ bgcolor: 'var(--primary-light)', color: 'var(--primary)', width: 44, height: 44, border: '1px solid rgba(22, 163, 74, 0.1)' }}>
                          <IconComp />
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: 1, fontSize: '0.75rem' }}>
                          {c.SportName?.toUpperCase() || "CLASS"}
                        </Typography>
                      </Box>

                      <Typography variant="h5" sx={{ color: 'var(--text-main)', fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
                        {c.Title}
                      </Typography>

                      {/* displays coach, detailed class schedule, and fee info */}
                      <Box sx={{ mb: 2 }}>
                        <div className="pmc-detail-item">
                          <Person sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            Coach <strong>{c.CoachFirstName} {c.CoachLastName}</strong>
                            <Link 
                              component="button"
                              onClick={() => handleSeeMoreCoach(c)}
                              sx={{ 
                                ml: 1, 
                                color: 'var(--primary)', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              (see more)
                            </Link>
                          </Typography>
                        </div>
                        <div className="pmc-detail-item">
                          <EventNote sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {formatScheduleDetailed(c)}
                          </Typography>
                        </div>
                        <div className="pmc-detail-item">
                          <Place sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {c.CourtNames || "Arena Court"}
                          </Typography>
                        </div>
                        <div className="pmc-detail-item">
                          <Payments sx={{ fontSize: 20 }} />
                          <div className="pmc-fee-text">
                            {formatLKR(c.Fee)} <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>/{c.BillingType === 'MONTHLY' ? 'mo' : 'once'}</span>
                          </div>
                        </div>
                      </Box>

                      {/* banner alert for overdue payments with a direct link to the gateway */}
                      {!isPaid && (
                        <div className="pmc-payment-due-alert">
                          <Typography variant="body2" sx={{ color: '#ca8a04', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Payment Overdue
                          </Typography>
                          <Button 
                             className="pmc-pay-btn"
                             onClick={(e) => handlePayNow(e, c)}
                          >
                            Pay Now
                          </Button>
                        </div>
                      )}

                      {/* allows players to voluntarily withdraw from a class */}
                      <Box className="pmc-card-footer" sx={{ mt: !isPaid ? 2.5 : 'auto' }}>
                        <Button 
                          onClick={() => handleLeaveClass(c.EnrollmentID)}
                          className="pmc-leave-btn"
                          fullWidth
                          variant="outlined"
                          sx={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          Leave Class
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* payment processing modal for class dues */}
      {payClassData && (
          <ClassPaymentModal 
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            classData={payClassData}
            onPaymentSuccess={fetchMyClasses}
          />
      )}

      {/* popup for viewing coach biography and professional certificates */}
      <Dialog 
        open={coachModalOpen} 
        onClose={() => setCoachModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: "pbc-payment-dialog"
        }}
      >
        <DialogTitle className="pbc-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Person sx={{ color: '#00ff88' }} />
            {selectedCoach?.name}
          </Box>
          <IconButton
              aria-label="close"
              onClick={() => setCoachModalOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
              <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pbc-dialog-content">
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Professional Qualifications
          </Typography>
          {selectedCoach?.qualifications.length > 0 ? (
            <List disablePadding>
              {selectedCoach.qualifications.map((q, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Verified sx={{ color: '#00ff88', fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText primary={q} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500, color: 'white' }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, opacity: 0.5, py: 3, justifyContent: 'center' }}>
              <Info sx={{ fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'white' }}>No listed qualifications yet.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="pbc-dialog-actions" sx={{ p: 2 }}>
          <Button 
            onClick={() => setCoachModalOpen(false)} 
            className="pbc-cancel-btn"
            sx={{ fontWeight: 600 }}
          >
            Close Profile
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}