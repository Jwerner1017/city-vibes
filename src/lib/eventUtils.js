import moment from "moment";

// Collapses events that are really the same event repeated on consecutive days
// (same title + location) into a single event spanning a date range, so the
// UI can show "runs Jul 1 – Jul 27" instead of one card/marker per day.
export function groupRunningEvents(events) {
  const sorted = [...events].sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  const groups = {};
  for (const e of sorted) {
    const key = `${(e.title || "").toLowerCase().trim()}|${(e.location_name || "").toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  const result = [];
  for (const key in groups) {
    const list = groups[key];
    let run = [list[0]];
    for (let i = 1; i < list.length; i++) {
      const prevDay = moment(run[run.length - 1].date_start).startOf("day");
      const curDay = moment(list[i].date_start).startOf("day");
      if (curDay.diff(prevDay, "days") <= 1) {
        run.push(list[i]);
      } else {
        result.push(mergeRun(run));
        run = [list[i]];
      }
    }
    result.push(mergeRun(run));
  }
  return result;
}

function mergeRun(run) {
  if (run.length === 1) return run[0];
  const first = run[0];
  const last = run[run.length - 1];
  return {
    ...first,
    date_end: last.date_end || last.date_start,
    is_running_event: true,
    range_end: last.date_start,
  };
}

// Returns events occurring on a given YYYY-MM-DD date, accounting for multi-day ranges.
export function eventsOnDate(events, dateStr) {
  return events.filter((e) => {
    const start = moment(e.date_start).format("YYYY-MM-DD");
    const end = moment(e.range_end || e.date_end || e.date_start).format("YYYY-MM-DD");
    return dateStr >= start && dateStr <= end;
  });
}