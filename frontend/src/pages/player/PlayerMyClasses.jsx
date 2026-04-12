import { useEffect, useMemo, useState } from "react";
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
  IconButton
} from "@mui/material";
import { 
  Person, 
  EventNote, 
  Place, 
  ArrowBack,
  Info,
  Payments,
  Schedule,
  CalendarMonth
} from "@mui/icons-material";
import "../../styles/PlayerMyClasses.css";
import ClassPaymentModal from "../../components/ClassPaymentModal";
import playerService from "../../services/playerService";

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t) {
  if (!t) return "";
  const timeStr = String(t);
  return timeStr.includes(':') ? timeStr.slice(0, 5) : timeStr;
}

function formatScheduleDetailed(c) {
  console.log("[Format] Class:", c.Title, "Start:", c.StartTime, "Days:", c.Weekdays);
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

export default function PlayerMyClasses() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(null);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payClassData, setPayClassData] = useState(null);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const data = await playerService.getMyClasses();
      console.log("[MyClasses] Enrollments:", data.enrollments);
      setEnrollments(data.enrollments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

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

  const handlePayNow = (e, enrollment) => {
    e.stopPropagation();
    setPayClassData({
      ClassID: enrollment.ClassID,
      Title: enrollment.Title,
      Fee: enrollment.Fee
    });
    setPaymentModalOpen(true);
  };

  return (
    <div className="pmc-page">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* HEADER SECTION */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: '#fff', 
              mb: 1,
              textShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              My Classes
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
              Manage your enrollments and track your progress.
            </Typography>
          </Box>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate("/player")}
            sx={{ 
              color: '#fff', 
              borderColor: 'rgba(255,255,255,0.3)',
              textTransform: 'none',
              borderRadius: '12px',
              px: 3,
              '&:hover': { borderColor: '#fff' }
            }}
            variant="outlined"
          >
            Dashboard
          </Button>
        </Box>

        {/* CONTENT */}
        {loading ? (
             <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
                <CircularProgress sx={{ color: '#00e676', mb: 2 }} />
                <Typography sx={{ color: '#fff', opacity: 0.8 }}>Loading your classes...</Typography>
             </Box>
        ) : enrollments.length === 0 ? (
          <Box className="heavy-frost-card" sx={{ textAlign: 'center', py: 12 }}>
            <CalendarMonth sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>No enrolled classes yet</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Your joined classes will appear here after payment.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {enrollments.map((c) => (
              <Grid item xs={12} md={6} key={c.EnrollmentID}>
                <Card className="heavy-frost-card">
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                       <Box>
                          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>{c.Title}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>#ENR-{c.EnrollmentID}</Typography>
                       </Box>
                       <Chip 
                         label={(c.PaymentStatus || "ACTIVE").toUpperCase()} 
                         sx={{ 
                            bgcolor: c.PaymentStatus === 'PAID' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 167, 38, 0.15)',
                            color: c.PaymentStatus === 'PAID' ? '#00e676' : '#ffa726',
                            fontWeight: 700,
                            border: `1px solid ${c.PaymentStatus === 'PAID' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 167, 38, 0.3)'}`
                         }}
                       />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                       <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Person sx={{ color: '#40c4ff', fontSize: 20 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Coach</Typography>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{c.CoachFirstName} {c.CoachLastName}</Typography>
                            </Box>
                          </Box>
                       </Grid>
                       <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Schedule sx={{ color: '#40c4ff', fontSize: 20 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Schedule</Typography>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{formatScheduleDetailed(c)}</Typography>
                            </Box>
                          </Box>
                       </Grid>
                       <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Place sx={{ color: '#40c4ff', fontSize: 20 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Location</Typography>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{c.CourtNames || "TBA"}</Typography>
                            </Box>
                          </Box>
                       </Grid>
                       <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Payments sx={{ color: '#40c4ff', fontSize: 20 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Fee</Typography>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{formatLKR(c.Fee)} / {c.BillingType === 'MONTHLY' ? 'Mo' : 'Once'}</Typography>
                            </Box>
                          </Box>
                       </Grid>
                    </Grid>

                    {c.PaymentStatus !== "PAID" && (
                         <Box sx={{ 
                            mt: 2, p: 2, 
                            borderRadius: '12px', 
                            background: 'rgba(255, 167, 38, 0.1)', 
                            border: '1px solid rgba(255, 167, 38, 0.2)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                         }}>
                            <Typography variant="body2" sx={{ color: '#ffa726', fontWeight: 600 }}>Payment is Due</Typography>
                            <Button 
                              size="small" 
                              variant="contained" 
                              sx={{ bgcolor: '#ffa726', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#fb8c00' } }}
                              onClick={(e) => handlePayNow(e, c)}
                            >
                                Pay Now
                            </Button>
                         </Box>
                    )}

                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => handleLeaveClass(c.EnrollmentID)}
                          sx={{ color: '#ff5252', textTransform: 'none', fontWeight: 600, '&:hover': { background: 'rgba(255,82,82,0.1)' } }}
                        >
                          Leave Class
                        </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Class Payment Modal */}
      {payClassData && (
          <ClassPaymentModal 
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            classData={payClassData}
            onPaymentSuccess={fetchMyClasses}
          />
      )}
    </div>
  );
}