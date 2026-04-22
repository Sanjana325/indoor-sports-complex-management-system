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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { 
  SportsCricket, 
  SportsTennis, 
  SportsSoccer, 
  SportsBasketball, 
  SportsVolleyball, 
  Person, 
  EventNote, 
  Group, 
  Payments,
  ArrowBack,
  Place,
  Verified,
  Info
} from "@mui/icons-material";
import "../../styles/PlayerAvailableClasses.css";
import ClassPaymentModal from "../../components/ClassPaymentModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// maps sport names to their corresponding MUI icons for the class cards
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
  return t.slice(0, 5); 
}

// combines date and time into a readable schedule label (e.g. "Mon, Wed | 09:00 - 10:00")
function formatSchedule(cls) {
  const timeRange = `${formatTime(cls.StartTime)} - ${formatTime(cls.EndTime)}`;
  if (cls.ScheduleType === "ONETIME") {
    return `One-Time | ${timeRange}`;
  }
  if (cls.Weekdays) {
    const days = cls.Weekdays.split(',')
      .map(d => DAY_MAP[parseInt(d)])
      .join(", ");
    return `${days} | ${timeRange}`;
  }
  return timeRange;
}

// catalog page for players to browse and enroll in professional sports classes
export default function PlayerAvailableClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [enrollClassData, setEnrollClassData] = useState(null);

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  // fetches all classes that have open capacity from the server
  async function fetchAvailableClasses() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/player/classes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setClasses(data.classes || []);
      } else {
        setError(data.message || "Failed to load classes");
      }
    } catch (err) {
      setError("Connection error. Please check your internet.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // validates if the player can join the class before opening the payment modal
  const handleEnrollClick = async (classId) => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/player/classes/${classId}/enroll`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            setEnrollClassData(data.class);
            setPaymentModalOpen(true);
        } else {
            alert(data.message || "Enrollment check failed");
        }
    } catch (err) {
        alert("Failed to initiate enrollment. Please try again.");
    }
  };

  // stores coach bio data to display in the profile popup
  const handleSeeMoreCoach = (cls) => {
    setSelectedCoach({
      name: `${cls.CoachFirstName} ${cls.CoachLastName}`,
      qualifications: cls.CoachQualifications ? cls.CoachQualifications.split(',') : []
    });
    setIsModalOpen(true);
  };


  return (
    <div className="pac-portal-container">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* main header with navigation back to player dashboard */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" className="pac-title">
              Available Classes
            </Typography>
            <Typography variant="h6" className="pac-subtitle">
              Join a class to level up your skills with expert coaching.
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

        {/* shows appropriate UI for loading, error, or empty class list */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: 'var(--primary)', mb: 2 }} />
            <Typography sx={{ color: 'var(--text-muted)' }}>Searching for open classes...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <Typography variant="h6" sx={{ color: '#ef4444', fontWeight: 700 }}>{error}</Typography>
            <Button onClick={fetchAvailableClasses} sx={{ mt: 2, color: 'var(--text-main)', fontWeight: 600 }}>Try Again</Button>
          </Box>
        ) : classes.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 12, 
            bgcolor: 'var(--bg-surface)', 
            borderRadius: '24px',
            border: '1px dashed var(--border-light)'
          }}>
            <EventNote sx={{ fontSize: 64, color: 'var(--text-muted)', opacity: 0.2, mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'var(--text-main)', mb: 1, fontWeight: 800 }}>No classes available right now</Typography>
            <Typography sx={{ color: 'var(--text-muted)' }}>All current classes are full or completed. Check back soon!</Typography>
          </Box>
        ) : (
          /* grid layout of all class cards matching the database results */
          <Grid container spacing={3}>
            {classes.map((cls) => {
              const IconComp = ICON_MAP[cls.SportName] || DEFAULT_ICON;
              return (
                <Grid item xs={12} sm={6} md={4} key={cls.ClassID}>
                  <Card className="heavy-frost-card">
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'var(--primary-light)', color: 'var(--primary)', width: 44, height: 44, border: '1px solid rgba(22, 163, 74, 0.1)' }}>
                            <IconComp />
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: 0.5 }}>
                            {cls.SportName.toUpperCase()}
                          </Typography>
                        </Box>
                        </Box>

                      <Typography variant="h5" sx={{ color: 'var(--text-main)', fontWeight: 800, mb: 2, lineHeight: 1.3 }}>
                        {cls.Title}
                      </Typography>

                      {/* displays coach name, schedule, and arena location */}
                      <Box sx={{ mb: 4 }}>
                        <div className="pac-detail-item">
                          <Person sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            Coach <strong>{cls.CoachFirstName} {cls.CoachLastName}</strong>
                            <Link 
                              component="button"
                              onClick={() => handleSeeMoreCoach(cls)}
                              sx={{ 
                                ml: 1, 
                                color: 'var(--primary)', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              (View Profile)
                            </Link>
                          </Typography>
                        </div>
                        <div className="pac-detail-item">
                          <EventNote sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {formatSchedule(cls)}
                          </Typography>
                        </div>
                        <div className="pac-detail-item">
                          <Place sx={{ fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {cls.CourtNames || "Arena Court"}
                          </Typography>
                        </div>
                      </Box>

                      {/* card footer showing the registration fee and enroll button */}
                      <Box className="card-footer-flex">
                        <Box>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.5 }}>Fee</Typography>
                          <div className="pac-fee-text">
                            LKR {Number(cls.Fee).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>/{cls.BillingType === 'MONTHLY' ? 'mo' : 'once'}</span>
                          </div>
                        </Box>
                        <Button 
                          variant="contained" 
                          onClick={() => handleEnrollClick(cls.ClassID)}
                          className="pac-enroll-btn"
                        >
                          Enroll Now
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* handles the pop-up display for coach professional credentials */}
        <Dialog 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
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
                onClick={() => setIsModalOpen(false)}
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
                <Typography variant="body2">No listed qualifications yet.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions className="pbc-dialog-actions" sx={{ p: 2 }}>
            <Button 
              onClick={() => setIsModalOpen(false)} 
              className="pbc-cancel-btn"
              sx={{ fontWeight: 600 }}
            >
              Close Profile
            </Button>
          </DialogActions>
        </Dialog>

        {/* reusable payment modal that handles gateway integration for class fees */}
        {enrollClassData && (
            <ClassPaymentModal 
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                classData={enrollClassData}
                onPaymentSuccess={() => navigate("/player/my-classes")}
            />
        )}
      </Container>
    </div>
  );
}