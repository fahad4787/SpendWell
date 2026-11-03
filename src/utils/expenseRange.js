/**
 * Financial Management period helpers (YYYY-MM-DD strings).
 */

function endOfMonthIso(fromYmd) {
  const d = new Date(`${fromYmd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return fromYmd;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = last.getFullYear();
  const m = String(last.getMonth() + 1).padStart(2, "0");
  const day = String(last.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Current calendar month [first, last] */
export function defaultExpenseRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${y}-${m}-01`;
  return { rangeStart: start, rangeEnd: endOfMonthIso(start) };
}

export function formatExpenseRangeLabelDisplay(start, end) {
  if (!start || !end) return "";
  const fmt = (ymd) => {
    const d = new Date(`${ymd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return ymd;
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };
  if (start === end) return fmt(start);
  return `${fmt(start)} → ${fmt(end)}`;
}
