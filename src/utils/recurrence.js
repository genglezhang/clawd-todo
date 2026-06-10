function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function today() {
  return toDateStr(new Date());
}

// Does a task (or its recurrence) occur on a given date?
export function taskOccursOnDate(task, dateStr) {
  const { startDate, endDate, recurrence } = task;
  if (!startDate) return false;
  if (dateStr < startDate) return false;

  const type = recurrence?.type ?? 'none';

  if (type === 'none') {
    if (!endDate || endDate === startDate) return dateStr === startDate;
    return dateStr <= endDate;
  }
  if (type === 'daily') return true;
  if (type === 'weekly') {
    const d = new Date(dateStr + 'T12:00:00');
    return (recurrence.weekdays ?? []).includes(d.getDay());
  }
  if (type === 'monthly') {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDate() === (recurrence.monthDay ?? 1);
  }
  return false;
}

export function getTasksForDate(tasks, dateStr) {
  return tasks.filter(t => taskOccursOnDate(t, dateStr));
}

// Multi-day span (shows as a bar in calendar)
export function isSpanTask(task) {
  return !!(
    task.startDate && task.endDate &&
    task.endDate > task.startDate &&
    (!task.recurrence || task.recurrence.type === 'none')
  );
}

// Calendar grid: returns array of weeks, each week is 7 date strings (Sun-Sat)
export function getCalendarWeeks(year, month) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const d = new Date(year, month, 1 - firstDow);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(toDateStr(d)); d.setDate(d.getDate() + 1); }
    weeks.push(week);
    if (d.getMonth() !== month) break;
  }
  return weeks;
}

// Compute positioned bars for a week row
export function computeWeekBars(weekDays, tasks) {
  const weekStart = weekDays[0];
  const weekEnd   = weekDays[6];

  const overlapping = tasks
    .filter(isSpanTask)
    .filter(t => t.startDate <= weekEnd && t.endDate >= weekStart)
    .sort((a, b) => a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0);

  const lanes = []; // lanes[i] = nextAvailableCol in lane i
  return overlapping.map(task => {
    const sc = task.startDate < weekStart ? 0 : weekDays.indexOf(task.startDate);
    const ec = task.endDate   > weekEnd   ? 6 : weekDays.indexOf(task.endDate);
    const cl = task.startDate < weekStart;
    const cr = task.endDate   > weekEnd;

    let lane = 0;
    while (lanes[lane] !== undefined && lanes[lane] > sc) lane++;
    lanes[lane] = ec + 1;

    return { task, startCol: sc, endCol: ec, continuesLeft: cl, continuesRight: cr, lane };
  });
}
