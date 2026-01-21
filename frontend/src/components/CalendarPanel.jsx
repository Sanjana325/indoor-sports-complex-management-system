import { useMemo } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function sameISO(a, b) {
  return a === b;
}
function startOfMonth(year, month) {
  return new Date(year, month, 1);
}
function endOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}
function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export default function CalendarPanel({
  monthDate,
  selectedDateISO,
  onChangeMonth,
  onSelectDate,
  eventsByDate, // { [dateISO]: { cricket:number, badminton:number, futsal:number, classes:number, blocked:number } }
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const { gridDays, monthLabel } = useMemo(() => {
    const first = startOfMonth(year, month);
    const last = endOfMonth(year, month);

    const monthLabelFmt = first.toLocaleString(undefined, { month: "long", year: "numeric" });

    // grid starts on Sunday
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    // grid ends on Saturday
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay()));

    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return { gridDays: days, monthLabel: monthLabelFmt };
  }, [year, month]);

  function goPrev() {
    onChangeMonth(addMonths(monthDate, -1));
  }
  function goNext() {
    onChangeMonth(addMonths(monthDate, 1));
  }
  function goToday() {
    const t = new Date();
    onChangeMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    onSelectDate(toISODate(t));
  }

  return (
    <div className="ah-cal">
      <div className="ah-cal-top">
        <div className="ah-cal-left">
          <button className="ah-cal-nav" type="button" onClick={goPrev} aria-label="Previous month">
            ←
          </button>
          <button className="ah-cal-nav" type="button" onClick={goNext} aria-label="Next month">
            →
          </button>

          <div className="ah-cal-month">{monthLabel}</div>
        </div>

        <button className="ah-cal-today" type="button" onClick={goToday}>
          Today
        </button>
      </div>

      <div className="ah-cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="ah-cal-weekday">
            {w}
          </div>
        ))}

        {gridDays.map((d) => {
          const inMonth = d.getMonth() === month;
          const iso = toISODate(d);
          const isSelected = selectedDateISO && sameISO(iso, selectedDateISO);

          const counts = eventsByDate?.[iso] || null;
          const hasSomething =
            counts &&
            (counts.cricket || counts.badminton || counts.futsal || counts.classes || counts.blocked);

          return (
            <button
              key={iso}
              type="button"
              className={[
                "ah-day",
                inMonth ? "" : "muted",
                isSelected ? "selected" : "",
              ].join(" ")}
              onClick={() => onSelectDate(iso)}
            >
              <div className="ah-day-num">{d.getDate()}</div>

              <div className="ah-day-bars">
                {/* cricket */}
                {counts?.cricket ? <span className="ah-bar cricket" title={`Cricket: ${counts.cricket}`} /> : null}
                {/* badminton */}
                {counts?.badminton ? (
                  <span className="ah-bar badminton" title={`Badminton: ${counts.badminton}`} />
                ) : null}
                {/* futsal */}
                {counts?.futsal ? <span className="ah-bar futsal" title={`Futsal: ${counts.futsal}`} /> : null}
                {/* classes */}
                {counts?.classes ? <span className="ah-bar classes" title={`Classes: ${counts.classes}`} /> : null}
                {/* blocked */}
                {counts?.blocked ? <span className="ah-bar blocked" title={`Blocked: ${counts.blocked}`} /> : null}

                {!hasSomething ? <span className="ah-bar none" /> : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="ah-legend">
        <div className="ah-leg-item">
          <span className="ah-dot cricket" /> Cricket
        </div>
        <div className="ah-leg-item">
          <span className="ah-dot badminton" /> Badminton
        </div>
        <div className="ah-leg-item">
          <span className="ah-dot futsal" /> Futsal
        </div>
        <div className="ah-leg-item">
          <span className="ah-dot classes" /> Classes
        </div>
        <div className="ah-leg-item">
          <span className="ah-dot blocked" /> Blocked
        </div>
      </div>
    </div>
  );
}
