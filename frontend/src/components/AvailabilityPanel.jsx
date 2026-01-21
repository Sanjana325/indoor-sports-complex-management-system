export default function AvailabilityPanel({ title = "Availability", courts = [] }) {
  return (
    <div className="ah-side">
      <div className="ah-side-title">{title}</div>

      <div className="ah-side-list">
        {courts.map((c) => (
          <div key={c.name} className="ah-side-row">
            <div className="ah-side-left">
              <span className={`ah-dot ${c.sportKey}`} />
              <div className="ah-side-court">{c.name}</div>
            </div>

            <div className={`ah-side-status ${c.statusKey}`}>{c.statusLabel}</div>
          </div>
        ))}
      </div>

      <div className="ah-side-note">
        <div className="ah-note-row">
          <span className="ah-mini available" /> Available
        </div>
        <div className="ah-note-row">
          <span className="ah-mini booked" /> Booked
        </div>
        <div className="ah-note-row">
          <span className="ah-mini blocked" /> Blocked
        </div>
      </div>
    </div>
  );
}
