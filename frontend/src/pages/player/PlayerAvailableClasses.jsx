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
  Container
} from "@mui/material";
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
  ArrowBack
} from "@mui/icons-material";
import "../../styles/PlayerAvailableClasses.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ICON_MAP = {
  "Cricket": SportsCricket,
  "Badminton": SportsTennis,
  "Futsal": SportsSoccer,
  "Basketball": SportsBasketball,
  "Volleyball": SportsVolleyball,
};

const DEFAULT_ICON = SportsSoccer;

export default function PlayerAvailableClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

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

  const handleEnrollClick = (classId) => {
    console.log("Enroll initiated for ClassID:", classId);
    alert(`Enrolling in class ${classId}... (Logic coming soon)`);
  };

  return (
    <div className="pac-portal-container">
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* HEADER SECTION */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: '#fff', 
              mb: 1,
              textShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              Available Classes
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
              Join a class to level up your skills with expert coaching.
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

        {/* LOADING STATE */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#00e676', mb: 2 }} />
            <Typography sx={{ color: '#fff', opacity: 0.8 }}>Searching for open classes...</Typography>
          </Box>
        ) : error ? (
          /* ERROR STATE */
          <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'rgba(255,0,0,0.1)', borderRadius: '16px' }}>
            <Typography variant="h6" sx={{ color: '#ff5252' }}>{error}</Typography>
            <Button onClick={fetchAvailableClasses} sx={{ mt: 2, color: '#fff' }}>Try Again</Button>
          </Box>
        ) : classes.length === 0 ? (
          /* EMPTY STATE */
          <Box sx={{ 
            textAlign: 'center', 
            py: 12, 
            bgcolor: 'rgba(255,255,255,0.05)', 
            borderRadius: '24px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <EventNote sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>No classes available right now</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>All current classes are full or completed. Check back soon!</Typography>
          </Box>
        ) : (
          /* CLASSES GRID */
          <Grid container spacing={4}>
            {classes.map((cls) => {
              const IconComp = ICON_MAP[cls.SportName] || DEFAULT_ICON;
              return (
                <Grid item xs={12} sm={6} md={4} key={cls.ClassID}>
                  <Card className="glass-card-class">
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* HEADER: Sport Badge */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'rgba(0, 230, 118, 0.15)', color: '#00e676', width: 44, height: 44 }}>
                            <IconComp />
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ color: '#00e676', fontWeight: 700, letterSpacing: 1.2 }}>
                            {cls.SportName.toUpperCase()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${cls.EnrolledCount}/${cls.Capacity}`} 
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            color: '#fff', 
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      </Box>

                      {/* TITLE */}
                      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 1.5, lineHeight: 1.2 }}>
                        {cls.Title}
                      </Typography>

                      {/* DETAILS */}
                      <Box sx={{ mb: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, opacity: 0.8 }}>
                          <Person sx={{ fontSize: 18, color: '#40c4ff' }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            Coach: <strong>{cls.CoachFirstName} {cls.CoachLastName}</strong>
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, opacity: 0.8 }}>
                          <EventNote sx={{ fontSize: 18, color: '#40c4ff' }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            Starts: {new Date(cls.StartDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, opacity: 0.8 }}>
                          <Group sx={{ fontSize: 18, color: '#40c4ff' }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {cls.Capacity - cls.EnrolledCount} Slots Remaining
                          </Typography>
                        </Box>
                      </Box>

                      {/* FEE & ACTION */}
                      <Box sx={{ mt: 2, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Fee</Typography>
                          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                            {cls.Fee} <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>/ {cls.BillingType}</span>
                          </Typography>
                        </Box>
                        <Button 
                          variant="contained" 
                          onClick={() => handleEnrollClick(cls.ClassID)}
                          sx={{ 
                            bgcolor: '#00e676', 
                            color: '#000', 
                            fontWeight: 700,
                            borderRadius: '10px',
                            px: 3,
                            '&:hover': { bgcolor: '#00c853' }
                          }}
                        >
                          ENROLL NOW
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
    </div>
  );
}