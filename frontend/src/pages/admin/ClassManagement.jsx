import { useMemo, useState } from "react";
import "../../styles/ClassManagement.css";

const SPORTS = ["CRICKET", "KARATE", "FUTSAL", "CHESS", "BADMINTON"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function makeId(prefix = "CL") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDays(days) {
  if (!days || days.length === 0) return "-";
  return days.join(", ");
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
  return dateStr;
}

function formatLKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK")}`;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState([
    {
      id: "CL-300001",
      sport: "CRICKET",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      scheduleType: "WEEKLY",
      days: ["Mon", "Wed"],
      oneTimeDate: "",
      startTime: "18:00",
      endTime: "19:30",
      capacity: 20,
      fee: 2500,
      createdAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "CL-300002",
      sport: "KARATE",
      className: "Karate Basics",
      coachName: "Nimal Perera",
      scheduleType: "WEEKLY",
      days: ["Tue", "Thu"],
      oneTimeDate: "",
      startTime: "17:30",
      endTime: "19:00",
      capacity: 25,
      fee: 3000,
      createdAt: "2026-01-18T12:00:00.000Z",
    },
    {
      id: "CL-300003",
      sport: "FUTSAL",
      className: "Futsal Training",
      coachName: "Kasun Silva",
      scheduleType: "WEEKLY",
      days: ["Sat"],
      oneTimeDate: "",
      startTime: "16:00",
      endTime: "18:00",
      capacity: 18,
      fee: 3500,
      createdAt: "2026-01-19T08:00:00.000Z",
    },
    {
      id: "CL-300004",
      sport: "CHESS",
      className: "Chess for Beginners",
      coachName: "Ishan Fernando",
      scheduleType: "WEEKLY",
      days: ["Sun"],
      oneTimeDate: "",
      startTime: "09:00",
      endTime: "11:00",
      capacity: 30,
      fee: 2000,
      createdAt: "2026-01-19T09:30:00.000Z",
    },
    {
      id: "CL-300005",
      sport: "BADMINTON",
      className: "Badminton Intermediate",
      coachName: "Dilani Jayasinghe",
      scheduleType: "WEEKLY",
      days: ["Fri"],
      oneTimeDate: "",
      startTime: "18:00",
      endTime: "19:30",
      capacity: 16,
      fee: 2800,
      createdAt: "2026-01-19T10:15:00.000Z",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD");
  const [editingId, setEditingId] = useState(null);

  const [sport, setSport] = useState("CRICKET");
  const [className, setClassName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [fee, setFee] = useState("");

  const [scheduleType, setScheduleType] = useState("WEEKLY");
  const [days, setDays] = useState([]);
  const [oneTimeDate, setOneTimeDate] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredClasses = useMemo(() => {
    if (!normalizedSearch) return classes;
    return classes.filter((c) => {
      const hay =
        `${c.id} ${c.sport} ${c.className} ${c.coachName} ` +
        `${(c.days || []).join(" ")} ${c.oneTimeDate || ""} ${c.startTime} ${c.endTime} ${c.capacity} ${c.fee}`.toLowerCase();
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
    setSport("CRICKET");
    setClassName("");
    setCoachName("");
    setCapacity("");
    setFee("");

    setScheduleType("WEEKLY");
    setDays([]);
    setOneTimeDate("");

    setStartTime("");
    setEndTime("");

    setEditingId(null);
  }

  function openAddModal() {
    setMode("ADD");
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setMode("EDIT");
    setEditingId(item.id);

    setSport(item.sport);
    setClassName(item.className);
    setCoachName(item.coachName);
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

  function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this class?");
    if (!ok) return;
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }

  function toggleDay(d) {
    setDays((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      return [...prev, d];
    });
  }

  function handleOneTimeToggle(checked) {
    if (checked) {
      setScheduleType("ONETIME");
      setDays([]);
    } else {
      setScheduleType("WEEKLY");
      setOneTimeDate("");
    }
  }

  function validateForm() {
    if (!SPORTS.includes(sport)) return "Select a valid sport";
    if (!className.trim()) return "Class name is required";
    if (!coachName.trim()) return "Coach name is required";

    const capNum = Number(capacity);
    if (!Number.isFinite(capNum) || capNum <= 0) return "Capacity must be a positive number";

    const feeNum = Number(fee);
    if (!Number.isFinite(feeNum) || feeNum <= 0) return "Class fee must be a positive number";

    if (scheduleType === "WEEKLY") {
      if (!Array.isArray(days) || days.length === 0) return "Select at least one day";
    } else {
      if (!oneTimeDate) return "Select a date for the one-time class";
    }

    if (!startTime) return "Start time is required";
    if (!endTime) return "End time is required";

    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    if (s === null || e === null) return "Select valid start/end time";
    if (e <= s) return "End time must be after start time";

    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    const capNum = Number(capacity);
    const feeNum = Number(fee);

    const payload = {
      sport,
      className: className.trim(),
      coachName: coachName.trim(),
      scheduleType,
      days: scheduleType === "WEEKLY" ? [...days] : [],
      oneTimeDate: scheduleType === "ONETIME" ? oneTimeDate : "",
      startTime,
      endTime,
      capacity: capNum,
      fee: feeNum,
    };

    if (mode === "ADD") {
      const newClass = {
        id: makeId("CL"),
        ...payload,
        createdAt: nowIso(),
      };
      setClasses((prev) => [newClass, ...prev]);
      closeModal();
      resetForm();
      return;
    }

    if (mode === "EDIT") {
      setClasses((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c)));
      closeModal();
      resetForm();
    }
  }

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
          placeholder="Search by class name, coach, sport, day, date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section className="cm-section">
        <h3 className="cm-section-title">Cricket Classes</h3>
        <ClassTable rows={cricketRows} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Karate Classes</h3>
        <ClassTable rows={karateRows} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Futsal Classes</h3>
        <ClassTable rows={futsalRows} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Chess Classes</h3>
        <ClassTable rows={chessRows} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Badminton Classes</h3>
        <ClassTable rows={badmintonRows} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

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
                  <select value={sport} onChange={(e) => setSport(e.target.value)}>
                    <option value="CRICKET">Cricket</option>
                    <option value="KARATE">Karate</option>
                    <option value="FUTSAL">Futsal</option>
                    <option value="CHESS">Chess</option>
                    <option value="BADMINTON">Badminton</option>
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
                  <label>Coach Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sahan Fernando"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                  />
                </div>

                <div className="cm-field cm-full">
                  <label>Day / Days (Every week)</label>

                  <div className={`cm-days ${scheduleType === "ONETIME" ? "is-disabled" : ""}`}>
                    {DAYS.map((d) => (
                      <label key={d} className="cm-day">
                        <input
                          type="checkbox"
                          checked={days.includes(d)}
                          onChange={() => toggleDay(d)}
                          disabled={scheduleType === "ONETIME"}
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>

                  <label className="cm-onetime">
                    <input
                      type="checkbox"
                      checked={scheduleType === "ONETIME"}
                      onChange={(e) => handleOneTimeToggle(e.target.checked)}
                    />
                    One-time class / No fixed schedule
                  </label>
                </div>

                {scheduleType === "ONETIME" && (
                  <div className="cm-field cm-full">
                    <label>Select Date</label>
                    <input
                      type="date"
                      value={oneTimeDate}
                      onChange={(e) => setOneTimeDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="cm-field">
                  <label>Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="cm-field">
                  <label>End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>

                <div className="cm-field cm-full">
                  <div className="cm-duration">
                    Duration: <strong>{durationLabel(startTime, endTime)}</strong>
                  </div>
                </div>
              </div>

              <div className="cm-form-actions">
                <button className="cm-modal-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="cm-modal-btn" type="submit">
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

function ClassTable({ rows, onEdit, onRemove }) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th className="cm-col-class">Class Name</th>
            <th className="cm-col-coach">Coach Name</th>
            <th className="cm-col-days">Day(s)</th>
            <th className="cm-col-date">Date</th>
            <th className="cm-col-duration">Duration</th>
            <th className="cm-col-capacity">Capacity</th>
            <th className="cm-col-fee">Fee</th>
            <th className="cm-col-actions cm-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="8" className="cm-empty">
                No classes to show.
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr key={c.id}>
                <td className="cm-col-class">{c.className}</td>
                <td className="cm-col-coach">{c.coachName}</td>
                <td className="cm-col-days">{formatDays(c.days)}</td>
                <td className="cm-col-date">{formatDate(c.oneTimeDate)}</td>
                <td className="cm-col-duration">{durationLabel(c.startTime, c.endTime)}</td>
                <td className="cm-col-capacity">{c.capacity}</td>
                <td className="cm-col-fee">{formatLKR(c.fee)}</td>

                <td className="cm-col-actions cm-center">
                  <div className="cm-actions">
                    <button className="cm-action-btn" type="button" onClick={() => onEdit(c)}>
                      Edit
                    </button>
                    <button className="cm-action-btn danger" type="button" onClick={() => onRemove(c.id)}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
