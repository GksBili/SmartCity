export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay(); // 0 Sun, 1 Mon ...
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getWeekDates(baseDate) {
  const start = getStartOfWeek(baseDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function addWeeks(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount * 7);
  return copy;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDayLabel(date) {
  return date.toLocaleDateString([], { weekday: "short" });
}

export function getMonthRangeLabel(weekDates) {
  if (!weekDates.length) return "";
  const first = weekDates[0];
  const last = weekDates[6];

  const firstMonth = first.toLocaleDateString([], { month: "short" });
  const lastMonth = last.toLocaleDateString([], { month: "short" });

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${first.getDate()} - ${last.getDate()}`;
  }

  return `${firstMonth} ${first.getDate()} - ${lastMonth} ${last.getDate()}`;
}

export function sortEventsByTime(events = []) {
  return [...events].sort((a, b) => {
    const aTime = a.time24 || "00:00";
    const bTime = b.time24 || "00:00";
    return aTime.localeCompare(bTime);
  });
}

export function formatTime12Hour(time24 = "00:00") {
  const [hStr, mStr] = time24.split(":");
  let hour = Number(hStr);
  const minute = mStr || "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}
