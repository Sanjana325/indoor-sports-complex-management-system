function niceDate(iso) {
  // iso: YYYY-MM-DD
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function EmptyState({ text }) {
  return <div className="ah-empty">{text}</div>;
}

export default function DayDetailsModal({ dateISO, data, onClose }) {
  if (!dateISO) return null;

  const bookings = data?.bookings || [];
  const blocked = data?.blocked || [];
  const classes = data?.classes || [];

  return (
    <div className="ah-modal-backdrop" onMouseDown={onClose}>
      <div className="ah-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ah-modal-head">
          <div>
            <div className="ah-modal-title">Day Schedule</div>
            <div className="ah-modal-sub">{niceDate(dateISO)}</div>
          </div>

          <button className="ah-x" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ah-modal-body">
          <div className="ah-list-section">
            <div className="ah-list-title">Bookings</div>

            {bookings.length === 0 ? (
              <EmptyState text="No bookings for this date." />
            ) : (
              <div className="ah-list">
                {bookings.map((b) => (
                  <div key={b.id} className="ah-item">
                    <div className="ah-item-left">
                      <div className="ah-item-time">{b.time}</div>
                      <div className="ah-item-main">
                        <span className={`ah-tag ${b.sportKey}`}>{b.sportLabel}</span>
                        {b.court} — {b.playerName}
                      </div>
                    </div>
                    <div className={`ah-pill ${b.statusKey}`}>{b.statusLabel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ah-list-section">
            <div className="ah-list-title">Blocked Slots</div>

            {blocked.length === 0 ? (
              <EmptyState text="No blocked slots for this date." />
            ) : (
              <div className="ah-list">
                {blocked.map((x) => (
                  <div key={x.id} className="ah-item">
                    <div className="ah-item-left">
                      <div className="ah-item-time">
                        {x.startTime}–{x.endTime}
                      </div>
                      <div className="ah-item-main">
                        <span className="ah-tag blocked">Blocked</span>
                        {x.court} — {x.reason}
                      </div>
                    </div>
                    <div className="ah-pill blocked">Blocked</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ah-list-section">
            <div className="ah-list-title">Classes</div>

            {classes.length === 0 ? (
              <EmptyState text="No classes for this date." />
            ) : (
              <div className="ah-list">
                {classes.map((c) => (
                  <div key={c.id} className="ah-item">
                    <div className="ah-item-left">
                      <div className="ah-item-time">
                        {c.startTime}–{c.endTime}
                      </div>
                      <div className="ah-item-main">
                        <span className="ah-tag classes">Class</span>
                        {c.className} — {c.coachName}
                      </div>
                    </div>
                    <div className="ah-pill classes">{c.duration}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ah-modal-foot">
          <button className="ah-modal-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
