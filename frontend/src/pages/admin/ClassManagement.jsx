import { useMemo, useState, useEffect } from "react";
import api from "../../services/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DAYS = [
  { label: "Mon", value: 1 }, { label: "Tue", value: 2 }, { label: "Wed", value: 3 },
  { label: "Thu", value: 4 }, { label: "Fri", value: 5 }, { label: "Sat", value: 6 },
  { label: "Sun", value: 0 }
];

function formatDays(days) {
  if (!days || !Array.isArray(days)) return [];
  const dayMap = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 0: "Sun" };
  return days.map(d => dayMap[d] || d);
}

function timeToMinutes(t) {
  if (!t || !t.includes(":")) return null;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function durationLabel(startTime, endTime) {
  const s = timeToMinutes(startTime); const e = timeToMinutes(endTime);
  if (s === null || e === null || e <= s) return "-";
  const diff = e - s; const h = Math.floor(diff / 60); const m = diff % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
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
  const [courtIds, setCourtIds] = useState([]);
  const [capacity, setCapacity] = useState("");
  const [fee, setFee] = useState("");
  const [scheduleType, setScheduleType] = useState("WEEKLY");
  const [days, setDays] = useState([]);
  const [oneTimeDate, setOneTimeDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [cancelledHistory, setCancelledHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const getBasePath = () => localStorage.getItem("role") === "STAFF" ? "/api/staff" : "/api/admin";
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => { fetchInitialData(); }, []);

  async function fetchInitialData() {
    try {
      setLoadingInitial(true);
      const base = getBasePath();
      const [spRes, cRes, clsRes, histRes] = await Promise.all([
        api.get("/api/admin/sports"),
        api.get("/api/admin/coaches"),
        api.get(`${base}/classes`),
        api.get("/api/admin/classes/cancellations/history")
      ]);
      setSportsList(spRes.data.sports || []); 
      if (spRes.data.sports?.length > 0) setSport(spRes.data.sports[0].SportName);
      setCoachesList(cRes.data.coaches || []);
      setClasses(clsRes.data.classes || []);
      setCancelledHistory(histRes.data.history || []);
    } catch (err) { console.error(err); } finally { setLoadingInitial(false); }
  }

  const selectedSportObj = useMemo(() => sportsList.find(s => s.SportName === sport) || null, [sport, sportsList]);
  const filteredCoaches = useMemo(() => sport ? coachesList.filter(c => c.sports.includes(sport)) : coachesList, [coachesList, sport]);
  const hasSlotInputs = useMemo(() => {
    if (!startTime || !endTime || !selectedSportObj) return false;
    return scheduleType === "WEEKLY" ? (days.length > 0 && !!startDate) : !!oneTimeDate;
  }, [startTime, endTime, scheduleType, days, oneTimeDate, startDate, selectedSportObj]);

  useEffect(() => {
    async function fetchCourts() {
      if (!hasSlotInputs) { setAvailableCourts([]); return; }
      try {
        const q = new URLSearchParams({ sportId: selectedSportObj.SportID, scheduleType, startTime, endTime });
        if (mode === "EDIT" && editingId) q.set("excludeClassId", String(editingId));
        if (scheduleType === "ONE_TIME") q.append("oneTimeDate", oneTimeDate);
        else { q.append("startDate", startDate); days.forEach(d => q.append("weekdays", d)); }
        const res = await api.get(`/api/admin/classes/available-courts?${q.toString()}`);
        setAvailableCourts(res.data.availableCourts || []);
      } catch (err) { console.error(err); }
    }
    const timer = setTimeout(fetchCourts, 300);
    return () => clearTimeout(timer);
  }, [hasSlotInputs, selectedSportObj, scheduleType, startTime, endTime, oneTimeDate, startDate, days, mode, editingId]);

  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? classes.filter((c) => `${c.className} ${c.coachName} ${c.sport}`.toLowerCase().includes(q)) : classes;
  }, [classes, search]);

  function resetForm() {
    setClassName(""); setCoachId(""); setCourtIds([]); setCapacity(""); setFee(""); setScheduleType("WEEKLY");
    setDays([]); setOneTimeDate(""); setStartDate(""); setStartTime(""); setEndTime(""); setFormError(""); setIsConflict(false);
  }

  function openAddModal() { setMode("ADD"); resetForm(); if (sportsList.length > 0) setSport(sportsList[0].SportName); setIsModalOpen(true); }
  function openEditModal(item) { setMode("EDIT"); setEditingId(item.id); setSport(item.sport); setClassName(item.className); setCoachId(String(item.coachId)); setCourtIds(item.courtIds || []); setCapacity(String(item.capacity)); setFee(String(item.fee || "")); setScheduleType(item.scheduleType || "WEEKLY"); setDays(item.days || []); setOneTimeDate(item.oneTimeDate || ""); setStartDate(item.startDate?.split('T')[0] || ""); setStartTime(item.startTime || ""); setEndTime(item.endTime || ""); setIsModalOpen(true); }

  async function handleToggleStatus(item) {
    const isDeactivating = item.status !== "DEACTIVATED";
    if (!window.confirm(`Are you sure you want to ${isDeactivating ? "deactivate" : "activate"} this class?`)) return;
    try {
      const res = await api.patch(`/api/admin/classes/${item.id}/${isDeactivating ? "deactivate" : "activate"}`);
      if (res.status === 200) fetchInitialData();
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setFormError(""); setSubmitting(true);
    const payload = { title: className.trim(), sportId: selectedSportObj.SportID, coachId: Number(coachId), courtIds: courtIds.map(Number), capacity: Number(capacity), fee: Number(fee), billingType: scheduleType === "WEEKLY" ? "MONTHLY" : "ONE_TIME", scheduleType, startDate: scheduleType === "WEEKLY" ? startDate : oneTimeDate, oneTimeDate: scheduleType === "ONE_TIME" ? oneTimeDate : "", startTime, endTime, weekdays: scheduleType === "WEEKLY" ? days : [] };
    try {
      const url = mode === "ADD" ? "/api/admin/classes" : `/api/admin/classes/${editingId}`;
      const res = mode === "ADD" ? await api.post(url, payload) : await api.put(url, payload);
      if (res.status === 200 || res.status === 201) { setIsModalOpen(false); fetchInitialData(); }
      else { setFormError(res.data.message || "Failed to save"); setIsConflict(res.status === 409); }
    } catch (err) { 
      setFormError(err.response?.data?.message || "Connection failed"); 
      setIsConflict(err.response?.status === 409);
    }
    finally { setSubmitting(false); }
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Classes</h2>
          <div className="flex-start mt-2" style={{ gap: "12px" }}>
            <button className={`btn ${activeTab === "ACTIVE" ? "btn-primary" : "btn-secondary"}`} style={{ borderRadius: "20px", padding: "6px 16px", fontSize: "0.8rem" }} onClick={() => setActiveTab("ACTIVE")}>Active Schedules</button>
            <button className={`btn ${activeTab === "HISTORY" ? "btn-danger" : "btn-secondary"}`} style={{ borderRadius: "20px", padding: "6px 16px", fontSize: "0.8rem" }} onClick={() => setActiveTab("HISTORY")}>Cancellation Log</button>
          </div>
        </div>
        {activeTab === "ACTIVE" && localStorage.getItem("role") === "ADMIN" && (
          <button className="btn btn-primary" onClick={openAddModal}>+ Register Class</button>
        )}
      </div>

      {activeTab === "ACTIVE" ? (
        <>
          <div className="arena-card mb-3" style={{ padding: "var(--space-1)" }}>
            <input className="form-input" style={{ maxWidth: "400px" }} placeholder="Search classes, coaches, or sports..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="arena-table-container">
            <table className="arena-table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Coach</th>
                  <th>Arena Courts</th>
                  <th>Schedule Pattern</th>
                  <th>Timeline</th>
                  <th>Capacity</th>
                  {localStorage.getItem("role") === "ADMIN" && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loadingInitial ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>Analyzing educational framework...</td></tr>
                ) : filteredClasses.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No class records match your search.</td></tr>
                ) : (
                  filteredClasses.map(c => (
                    <tr key={c.id} style={{ opacity: c.status === "DEACTIVATED" ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: "1rem" }}>{c.className}</div>
                        <div className="status-pill info" style={{ marginTop: "4px" }}>{c.sport}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.coachName}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ID: C-{String(c.coachId).padStart(3, '0')}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 600 }}>{c.courtName || "Unassigned"}</div>
                      </td>
                      <td>
                        {c.scheduleType === "WEEKLY" ? (
                          <>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Starts: {c.startDate?.split('T')[0]}</div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {formatDays(c.days).map(d => <span key={d} style={{ background: "var(--bg-main)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>{d}</span>)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>{c.oneTimeDate?.split('T')[0]}</div>
                            <span className="status-pill warning">One-Time Event</span>
                          </>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{c.startTime} - {c.endTime}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{durationLabel(c.startTime, c.endTime)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{c.capacity}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>LKR {c.fee?.toLocaleString()}</div>
                      </td>
                      {localStorage.getItem("role") === "ADMIN" && (
                        <td>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => openEditModal(c)}>Edit</button>
                            <button className={`btn ${c.status === "DEACTIVATED" ? "btn-primary" : "btn-danger"}`} style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => handleToggleStatus(c)}>{c.status === "DEACTIVATED" ? "Re-activate" : "Deactivate"}</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="arena-table-container">
          <table className="arena-table">
            <thead>
              <tr>
                <th>Incident Date</th>
                <th>Target Session</th>
                <th>Sport Discipline</th>
                <th>Coach Acknowledged</th>
                <th style={{ textAlign: "right" }}>System Logging</th>
              </tr>
            </thead>
            <tbody>
              {cancelledHistory.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No historical cancellations on record.</td></tr>
              ) : (
                cancelledHistory.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 700 }}>{h.date}</td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{h.className}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{h.startTime} - {h.endTime}</div>
                    </td>
                    <td><span className="status-pill info">{h.sport}</span></td>
                    <td>
                      <span className={`status-pill ${h.IsAcknowledged ? "success" : "danger"}`}>{h.IsAcknowledged ? "Verified" : "Pending Action"}</span>
                    </td>
                    <td style={{ textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>{h.coachFirst} {h.coachLast}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--space-2)" }}>
          <div className="arena-card" style={{ width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="mb-2">{mode === "ADD" ? "Create Academic Program" : "Modify Class Schedule"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="cm-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="form-group">
                  <label className="form-label">Sport Selection</label>
                  <select className="form-input" value={sport} onChange={e => {setSport(e.target.value); setCoachId(""); setCourtIds([]); }}>
                    {sportsList.map(s => <option key={s.SportName} value={s.SportName}>{s.SportName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pricing (LKR)</label>
                  <input className="form-input" type="number" value={fee} onChange={e => setFee(e.target.value)} required />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Official Class Title</label>
                  <input className="form-input" placeholder="e.g. Advanced Badminton Workshop" value={className} onChange={e => setClassName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Assigned Specialist (Coach)</label>
                  <select className="form-input" value={coachId} onChange={e => setCoachId(e.target.value)} required>
                    <option value="">-- Choose Coach --</option>
                    {filteredCoaches.map(c => <option key={c.id} value={c.id}>{c.name} (ID: {c.id})</option>)}
                  </select>
                </div>
                
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="flex-between mb-1" style={{ cursor: "pointer" }}>
                    <span className="form-label">Schedule Type</span>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <input type="radio" checked={scheduleType === "WEEKLY"} onChange={() => {setScheduleType("WEEKLY"); setOneTimeDate(""); setCourtIds([]);}} /> Weekly
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <input type="radio" checked={scheduleType === "ONE_TIME"} onChange={() => {setScheduleType("ONE_TIME"); setDays([]); setCourtIds([]);}} /> One-Time
                      </label>
                    </div>
                  </label>
                  {scheduleType === "WEEKLY" ? (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                      {DAYS.map(d => (
                        <button key={d.value} type="button" 
                          className={`btn ${days.includes(d.value) ? "btn-primary" : "btn-secondary"}`} 
                          style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "6px" }}
                          onClick={() => { setDays(prev => prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]); setCourtIds([]); }}
                        >{d.label}</button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="form-group">
                  <label className="form-label">{scheduleType === "WEEKLY" ? "Activation Date" : "Execution Date"}</label>
                  <input className="form-input" type="date" value={scheduleType === "WEEKLY" ? startDate : oneTimeDate} onChange={e => {if(scheduleType === "WEEKLY") setStartDate(e.target.value); else setOneTimeDate(e.target.value); setCourtIds([]);}} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Capacity</label>
                  <input className="form-input" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="time" value={startTime} onChange={e => {setStartTime(e.target.value); setCourtIds([]);}} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="time" value={endTime} onChange={e => {setEndTime(e.target.value); setCourtIds([]);}} required />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Arena Court Assignment</label>
                  {!hasSlotInputs ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "10px", background: "var(--bg-main)", borderRadius: "8px" }}>Configure schedule parameters to view available courts.</div>
                  ) : availableCourts.length === 0 ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--danger)", padding: "10px", background: "var(--danger-light)", borderRadius: "8px" }}>No courts available for this specific timeframe.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "10px", background: "var(--bg-main)", borderRadius: "8px", maxHeight: "120px", overflowY: "auto" }}>
                      {availableCourts.map(c => (
                        <label key={c.CourtID} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                          <input type="checkbox" checked={courtIds.includes(c.CourtID)} onChange={e => {
                            if(e.target.checked) setCourtIds(prev => [...prev, c.CourtID]);
                            else setCourtIds(prev => prev.filter(id => id !== c.CourtID));
                          }} />
                          {c.CourtName}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {formError && <div className={`status-pill ${isConflict ? "warning" : "danger"} mt-2`} style={{ width: "100%", textAlign: "center" }}>{formError}</div>}

              <div className="flex-between mt-3" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || availableCourts.length === 0}>{submitting ? "Processing..." : mode === "ADD" ? "Register Class" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
