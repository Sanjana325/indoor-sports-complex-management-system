import { useMemo, useState, useEffect } from "react";
import { Typography, Box, Paper, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput, Chip } from "@mui/material";
import "../../styles/ClassManagement.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 }
];

function formatDays(days) {
  if (!days || !Array.isArray(days) || days.length === 0) return [];
  const dayMap = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    0: "Sun"
  };
  return days.map(d => dayMap[d] || d);
}

function timeToMinutes(t) {
  if (!t || !t.includes(":")) return null;
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function durationLabel(startTime, endTime) {
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  if (s === null || e === null) return "-";
  const diff = e - s;
  if (diff <= 0) return "-";

  const h = Math.floor(diff / 60);
  const m = diff % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  // Attempt to parse out time component if present
  if (dateStr.includes('T')) return dateStr.split('T')[0];
  return dateStr;
}

function formatLKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK")}`;
}

function normalizeCoachId(v) {
  return (v || "").trim();
}

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [sportsList, setSportsList] = useState([]);
  const [coachesList, setCoachesList] = useState([]);
  const [availableCourts, setAvailableCourts] = useState([]);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [formError, setFormError] = useState("");
  const [isConflict, setIsConflict] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD");
  const [editingId, setEditingId] = useState(null);

  const [sport, setSport] = useState("");
  const [className, setClassName] = useState("");

  const [coachId, setCoachId] = useState("");
  const [coachName, setCoachName] = useState("");

  const [courtIds, setCourtIds] = useState([]); // Array of integers
  const [courtName, setCourtName] = useState(""); // For single legacy or internal use, but we'll focus on IDs

  const [capacity, setCapacity] = useState("");
  const [fee, setFee] = useState("");

  const [scheduleType, setScheduleType] = useState("WEEKLY"); // "WEEKLY" or "ONE_TIME"
  const [days, setDays] = useState([]); // array of integers (0-6)
  const [oneTimeDate, setOneTimeDate] = useState("");
  const [startDate, setStartDate] = useState(""); // Needed for WEEKLY classes

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoadingInitial(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [spRes, cRes, clsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/sports`, { headers }),
        fetch(`${API_BASE}/api/admin/coaches`, { headers }),
        fetch(`${API_BASE}/api/admin/classes`, { headers })
      ]);

      if (spRes.ok) {
        const d = await spRes.json();
        setSportsList(d.sports || []);
        if (d.sports && d.sports.length > 0) {
          setSport(d.sports[0].SportName); // Default
        }
      } else {
        const err = await spRes.json().catch(() => ({}));
        console.error("Sports fetch failed", err);
      }

      if (cRes.ok) {
        const d = await cRes.json();
        setCoachesList(d.coaches || []);
      } else {
        const err = await cRes.json().catch(() => ({}));
        console.error("Coaches fetch failed", err);
      }

      if (clsRes.ok) {
        const d = await clsRes.json();
        setClasses(d.classes || []);
      } else {
        const err = await clsRes.json().catch(() => ({}));
        alert(err.message || "Failed to fetch classes from server.");
      }
    } catch (err) {
      console.error("Fetch error", err);
      alert("Could not connect to the backend server. Please ensure it is running.");
    } finally {
      setLoadingInitial(false);
    }
  }

  // Derive sport ID from chosen sport name
  const selectedSportObj = useMemo(() => {
    return sportsList.find(s => s.SportName === sport) || null;
  }, [sport, sportsList]);

  const coachLookup = useMemo(() => {
    const id = Number(coachId);
    return coachesList.find(c => c.id === id) || null;
  }, [coachId, coachesList]);

  // Coaches whose specializations include the currently selected sport
  const filteredCoaches = useMemo(() => {
    if (!sport) return coachesList;
    return coachesList.filter(c => c.sports.includes(sport));
  }, [coachesList, sport]);

  const coachError = useMemo(() => {
    if (!coachId) return "";
    if (!coachLookup) return "Selected coach not found.";
    return "";
  }, [coachId, coachLookup]);

  const hasSlotInputs = useMemo(() => {
    if (!startTime || !endTime || !selectedSportObj) return false;
    if (scheduleType === "WEEKLY") return Array.isArray(days) && days.length > 0 && !!startDate;
    if (scheduleType === "ONE_TIME") return !!oneTimeDate;
    return false;
  }, [startTime, endTime, scheduleType, days, oneTimeDate, startDate, selectedSportObj]);

  // Fetch Available Courts
  useEffect(() => {
    async function fetchCourts() {
      if (!hasSlotInputs) {
        setAvailableCourts([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const q = new URLSearchParams({
          sportId: selectedSportObj.SportID,
          scheduleType,
          startTime,
          endTime
        });

        if (scheduleType === "ONE_TIME") {
          q.append("oneTimeDate", oneTimeDate);
        } else {
          q.append("startDate", startDate);
          days.forEach(d => q.append("weekdays", d));
        }

        const res = await fetch(`${API_BASE}/api/admin/classes/available-courts?${q.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setAvailableCourts(data.availableCourts || []);
        } else {
          setAvailableCourts([]);
        }
      } catch (err) {
        console.error("Court fetch error", err);
        setAvailableCourts([]);
      }
    }

    // We debounce slightly to avoid spamming the backend while user types time
    const timer = setTimeout(fetchCourts, 300);
    return () => clearTimeout(timer);
  }, [hasSlotInputs, selectedSportObj, scheduleType, startTime, endTime, oneTimeDate, startDate, days]);

  const filteredClasses = useMemo(() => {
    if (!normalizedSearch) return classes;
    return classes.filter((c) => {
      const hay =
        `${c.id} ${c.sport} ${c.className} ${c.coachId} ${c.coachName} ${c.courtName || ""} ` +
        `${(c.days || []).join(" ")} ${c.oneTimeDate || ""} ${c.startTime} ${c.endTime} ${c.capacity} ${c.fee} `.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [classes, normalizedSearch]);

  function bySport(sportKey) {
    return filteredClasses
      .filter((c) => c.sport === sportKey)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const cricketRows = useMemo(() => bySport("CRICKET"), [filteredClasses]);
  const karateRows = useMemo(() => bySport("KARATE"), [filteredClasses]);
  const futsalRows = useMemo(() => bySport("FUTSAL"), [filteredClasses]);
  const chessRows = useMemo(() => bySport("CHESS"), [filteredClasses]);
  const badmintonRows = useMemo(() => bySport("BADMINTON"), [filteredClasses]);

  function resetForm() {
    setSport("");
    setClassName("");
    setCoachId("");
    setCoachName("");
    setCourtIds([]);
    setCourtName("");
    setCapacity("");
    setFee("");
    setScheduleType("WEEKLY");
    setDays([]);
    setOneTimeDate("");
    setStartDate("");
    setStartTime("");
    setEndTime("");
    setEditingId(null);
    setFormError("");
    setIsConflict(false);
  }

  function openAddModal() {
    setMode("ADD");
    resetForm();
    // Always default to the first available sport so the dropdown is never blank
    if (sportsList.length > 0) {
      setSport(sportsList[0].SportName);
    }
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setMode("EDIT");
    setEditingId(item.id);

    setSport(item.sport);
    setClassName(item.className);

    setCoachId(item.coachId || "");
    setCoachName(item.coachName || "");

    setCourtIds(item.courtIds || []);
    setCourtName(item.courtName || "");

    setCapacity(String(item.capacity));
    setFee(String(item.fee ?? ""));

    setScheduleType(item.scheduleType || "WEEKLY");
    setDays(Array.isArray(item.days) ? item.days : []);
    setOneTimeDate(item.oneTimeDate || "");

    setStartTime(item.startTime || "");
    setEndTime(item.endTime || "");

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleToggleStatus(classItem) {
    const isDeactivating = classItem.status !== "DEACTIVATED";
    const actionText = isDeactivating ? "deactivate" : "activate";

    const ok = window.confirm(`Are you sure you want to ${actionText} this class?`);
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const endpoint = isDeactivating
        ? `${API_BASE}/api/admin/classes/${classItem.id}/deactivate`
        : `${API_BASE}/api/admin/classes/${classItem.id}/activate`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert(`Class ${actionText}d successfully.`);
        fetchInitialData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || `Failed to ${actionText} class.`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred connecting to the server.");
    }
  }

  function toggleDay(d) {
    setDays((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      return [...prev, d];
    });

    setCourtIds([]);
    setCourtName("");
  }

  function handleOneTimeToggle(checked) {
    if (checked) {
      setScheduleType("ONE_TIME");
      setDays([]);
      setStartDate("");
    } else {
      setScheduleType("WEEKLY");
      setOneTimeDate("");
    }

    setCourtIds([]);
    setCourtName("");
  }

  function handleSportChange(nextSport) {
    setSport(nextSport);

    setCoachId("");
    setCoachName("");

    setCourtIds([]);
    setCourtName("");
  }

  function onCoachIdChange(value) {
    const id = normalizeCoachId(value);
    setCoachId(id);

    const lookupId = Number(id);
    const found = coachesList.find(c => c.id === lookupId);
    setCoachName(found ? found.name : "");
  }

  function validateForm() {
    if (!selectedSportObj) return "Select a valid sport";
    if (!className.trim()) return "Class name is required";

    if (!coachId) return "Please select a coach";
    if (!coachLookup) return "Selected coach is invalid — please re-select";

    const capNum = Number(capacity);
    if (!Number.isFinite(capNum) || capNum <= 0) return "Capacity must be a positive number";

    const feeNum = Number(fee);
    if (!Number.isFinite(feeNum) || feeNum <= 0) return "Class fee must be a positive number";

    if (scheduleType === "WEEKLY") {
      if (!Array.isArray(days) || days.length === 0) return "Select at least one day";
      if (!startDate) return "Start date is required for WEEKLY schedule";
    } else {
      if (!oneTimeDate) return "Select a date for the one-time class";
    }

    if (!startTime) return "Start time is required";
    if (!endTime) return "End time is required";

    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    if (s === null || e === null) return "Select valid start/end time";
    if (e <= s) return "End time must be after start time";

    if (!courtIds || courtIds.length === 0) return "Select at least one available court";
    const allStillAvailable = courtIds.every(id => availableCourts.some((c) => c.CourtID === Number(id)));
    if (!allStillAvailable) return "One or more selected courts are no longer available for the chosen slot";

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    const payload = {
      title: className.trim(),
      sportId: selectedSportObj.SportID,
      coachId: Number(coachId),
      courtIds: courtIds.map(Number),
      capacity: Number(capacity),
      fee: Number(fee),
      billingType: scheduleType === "WEEKLY" ? "MONTHLY" : "ONE_TIME",
      scheduleType,
      startDate: scheduleType === "WEEKLY" ? startDate : "2000-01-01", 
      oneTimeDate: scheduleType === "ONE_TIME" ? oneTimeDate : "",
      startTime,
      endTime,
      weekdays: scheduleType === "WEEKLY" ? days : [],
    };

    // Fix start date constraint - send oneTimeDate as startDate too if it's ONE_TIME
    if (scheduleType === "ONE_TIME") payload.startDate = oneTimeDate;

    try {
      const token = localStorage.getItem("token");

      let res;
      if (mode === "ADD") {
        res = await fetch(`${API_BASE}/api/admin/classes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Mock EDIT implementation - not fully requested in Phase 3 instructions, but included for completeness if needed
        alert("Edit functionality requires additional backend endpoint! For MVP, edit is disabled.");
        return;
      }

      if (res.ok) {
        alert("Class saved successfully!");
        closeModal();
        resetForm();
        fetchInitialData(); // Refresh table
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.message || "An error occurred while saving the class.";
        setIsConflict(res.status === 409);
        setFormError(msg);
      }
    } catch (error) {
      console.error("Submission failed", error);
      setFormError("Failed to connect to the server.");
    }
  }

  const disableSubmit = useMemo(() => {
    if (!hasSlotInputs) return false;
    if (availableCourts.length === 0) return true;
    if (coachError) return true;
    return false;
  }, [hasSlotInputs, availableCourts.length, coachError]);

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h2 className="cm-title">Class Management</h2>
        </div>

        <button className="cm-primary-btn" type="button" onClick={openAddModal}>
          + Add Class
        </button>
      </div>

      <div className="cm-toolbar">
        <input
          className="cm-search"
          placeholder="Search by class name, coach, coach id, sport, court, day, date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClasses.length === 0 ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <Paper
            elevation={0}
            sx={{
              px: 6,
              py: 5,
              textAlign: "center",
              borderRadius: 3,
              background: "rgba(255,255,255,0.06)",
              border: "1px dashed rgba(255,255,255,0.15)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, color: "text.secondary" }}>
              No classes have been scheduled yet.
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Click <strong>+ Add Class</strong> to get started.
            </Typography>
          </Paper>
        </Box>
      ) : (
        sportsList.map((sportObj) => {
          const sportKey = sportObj.SportName;
          const classesForThisSport = filteredClasses
            .filter((c) => c.sport === sportKey)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          if (classesForThisSport.length === 0) return null;

          return (
            <section key={sportKey} className="cm-section">
              <h3 className="cm-section-title">
                {sportKey.charAt(0) + sportKey.slice(1).toLowerCase()} Classes
              </h3>
              <ClassTable
                rows={classesForThisSport}
                onEdit={openEditModal}
                onToggleStatus={handleToggleStatus}
              />
            </section>
          );
        })
      )}

      {isModalOpen && (
        <div className="cm-modal-backdrop" onMouseDown={closeModal}>
          <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>{mode === "ADD" ? "Add Class" : "Edit Class"}</h3>
              <button className="cm-icon-btn" type="button" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <form className="cm-form" onSubmit={handleSubmit}>
              <div className="cm-grid">
                <div className="cm-field">
                  <label>Sport</label>
                  <select value={sport} onChange={(e) => handleSportChange(e.target.value)}>
                    {sportsList.map(s => (
                      <option key={s.SportName} value={s.SportName}>{s.SportName}</option>
                    ))}
                  </select>
                </div>

                <div className="cm-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    placeholder="e.g. 20"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>

                <div className="cm-field">
                  <label>Class Fee</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                </div>

                <div className="cm-field cm-full">
                  <label>Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Beginner Cricket"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>

                <div className="cm-field cm-full">
                  <label>Coach</label>
                  {filteredCoaches.length === 0 ? (
                    <div className="cm-hint">
                      No coaches found for <strong>{sport}</strong>. Assign a sport specialization to a coach first.
                    </div>
                  ) : (
                    <select
                      value={coachId}
                      onChange={(e) => onCoachIdChange(e.target.value)}
                    >
                      <option value="">-- Select Coach --</option>
                      {filteredCoaches.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (ID: {c.id})
                        </option>
                      ))}
                    </select>
                  )}
                  {coachError ? <div className="cm-error">{coachError}</div> : null}
                </div>

                <div className="cm-field cm-full">
                  <label>Day / Days (Every week)</label>

                  <div className={`cm-days ${scheduleType === "ONE_TIME" ? "is-disabled" : ""} `}>
                    {DAYS.map((d) => (
                      <label key={d.value} className="cm-day">
                        <input
                          type="checkbox"
                          checked={days.includes(d.value)}
                          onChange={() => toggleDay(d.value)}
                          disabled={scheduleType === "ONE_TIME"}
                        />
                        <span>{d.label}</span>
                      </label>
                    ))}
                  </div>

                  <label className="cm-onetime">
                    <input
                      type="checkbox"
                      checked={scheduleType === "ONE_TIME"}
                      onChange={(e) => handleOneTimeToggle(e.target.checked)}
                    />
                    One-time class / No fixed schedule
                  </label>
                </div>

                {scheduleType === "WEEKLY" && (
                  <div className="cm-field cm-full">
                    <label>Start Date (Begins on)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCourtIds([]);
                        setCourtName("");
                      }}
                    />
                  </div>
                )}

                {scheduleType === "ONE_TIME" && (
                  <div className="cm-field cm-full">
                    <label>Select Date</label>
                    <input
                      type="date"
                      value={oneTimeDate}
                      onChange={(e) => {
                        setOneTimeDate(e.target.value);
                        setCourtIds([]);
                        setCourtName("");
                      }}
                    />
                  </div>
                )}

                <div className="cm-field">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setCourtIds([]);
                      setCourtName("");
                    }}
                  />
                </div>

                <div className="cm-field">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setCourtIds([]);
                      setCourtName("");
                    }}
                  />
                </div>

                <div className="cm-field cm-full">
                  <div className="cm-duration">
                    Duration: <strong>{durationLabel(startTime, endTime)}</strong>
                  </div>
                </div>

                <div className="cm-field cm-full">
                  <label>Courts (Select one or more)</label>

                  {!hasSlotInputs ? (
                    <div className="cm-hint">Select day/date and time first to load available courts.</div>
                  ) : availableCourts.length === 0 ? (
                    <div className="cm-no-courts">No available courts for the selected slot.</div>
                  ) : (
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={courtIds}
                        onChange={(e) => setCourtIds(e.target.value)}
                        input={<OutlinedInput size="small" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip 
                                key={value} 
                                label={availableCourts.find(c => c.CourtID === value)?.CourtName || value} 
                                size="small"
                              />
                            ))}
                          </Box>
                        )}
                        sx={{ 
                          bgcolor: 'white',
                          '& .MuiSelect-select': { py: 1 }
                        }}
                      >
                        {availableCourts.map((c) => (
                          <MenuItem key={c.CourtID} value={c.CourtID}>
                            <Checkbox checked={courtIds.indexOf(c.CourtID) > -1} size="small" />
                            <ListItemText primary={`${c.CourtName} (Cap: ${c.Capacity})`} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </div>
              </div>

              {formError && (
                <div className={isConflict ? "cm-conflict-error" : "cm-error cm-full-error"}>
                  {isConflict && <span className="cm-conflict-icon">⚠️ </span>}
                  {formError}
                </div>
              )}

              <div className="cm-form-actions">
                <button className="cm-modal-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="cm-modal-btn" type="submit" disabled={disableSubmit}>
                  {mode === "ADD" ? "Add Class" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassTable({ rows, onEdit, onToggleStatus }) {
  // Helper to format time strings (e.g., "18:00" -> "6:00 PM")
  const formatTimeInfo = (start, end) => {
    if (!start || !end) return "-";
    const formatStr = (t) => {
      const [h, m] = t.split(":");
      let hours = parseInt(h, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${m} ${ampm}`;
    };
    return `${formatStr(start)} - ${formatStr(end)}`;
  };

  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th className="cm-col-class">Class Name</th>
            <th className="cm-col-coach">Coach</th>
            <th className="cm-col-court">Courts</th>
            <th className="cm-col-schedule">Schedule & Start Date</th>
            <th className="cm-col-time">Time</th>
            <th className="cm-col-capacity">Capacity</th>
            <th className="cm-col-fee">Fee</th>
            <th className="cm-col-status">Status</th>
            <th className="cm-col-actions cm-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className={c.status === "DEACTIVATED" ? "cm-row-deactivated" : ""}>
              <td className="cm-col-class fw-semibold">{c.className}</td>
              <td className="cm-col-coach">{c.coachName}</td>
              <td className="cm-col-court">
                {c.courtName || "-"}
              </td>
              <td className="cm-col-schedule">
                {c.scheduleType === "WEEKLY" ? (
                  <div className="cm-schedule-cell">
                    <div className="cm-schedule-starts">Starts: {formatDate(c.startDate)}</div>
                    <div className="cm-day-badges">
                      {formatDays(c.days).length > 0 ? (
                        formatDays(c.days).map((dayStr, idx) => (
                          <span key={idx} className="cm-day-badge">{dayStr}</span>
                        ))
                      ) : (
                        <span className="cm-no-days">-</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cm-schedule-cell">
                    <div className="cm-schedule-starts">Date: {formatDate(c.oneTimeDate)}</div>
                    <div className="cm-day-badges">
                      <span className="cm-day-badge onetime">One-Time</span>
                    </div>
                  </div>
                )}
              </td>
              <td className="cm-col-time">{formatTimeInfo(c.startTime, c.endTime)}</td>
              <td className="cm-col-capacity">
                <span className="cm-capacity-badge">{c.capacity} Max</span>
              </td>
              <td className="cm-col-fee">{formatLKR(c.fee)}</td>
              <td className="cm-col-status">
                <span className={`cm-status-badge ${c.status === "DEACTIVATED" ? "deactivated" : "active"}`}>
                  {c.status || "ACTIVE"}
                </span>
              </td>

              <td className="cm-col-actions cm-actions-cell">
                <div className="cm-actions right-align">
                  <button className="cm-action-btn" type="button" onClick={() => onEdit(c)}>
                    Edit
                  </button>
                  <button
                    className={`cm-action-btn ${c.status === "DEACTIVATED" ? "success" : "danger"}`}
                    type="button"
                    onClick={() => onToggleStatus(c)}
                  >
                    {c.status === "DEACTIVATED" ? "Activate" : "Deactivate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

