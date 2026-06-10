import React, { useMemo } from 'react';
import {
  getCalendarWeeks, computeWeekBars, getTasksForDate, isSpanTask,
} from '../utils/recurrence.js';

const DOW = ['日', '一', '二', '三', '四', '五', '六'];
const BAR_H  = 16;
const BAR_GAP = 2;
const MAX_LANES  = 2;
const MAX_CHIPS  = 3; // max task chips per cell

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayStr() { return toDateStr(new Date()); }

function fmtMonthYear(year, month) {
  return `${year} 年 ${month + 1} 月`;
}
function fmtDateFull(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
}

// ── Day detail panel ──────────────────────────────────────────────────────────

function DayPanel({ dateStr, tasks, categories, onAdd, onEdit, onToggle, onDelete }) {
  const dayTasks = getTasksForDate(tasks, dateStr);
  return (
    <div className="day-panel">
      <div className="day-panel-hdr">
        <span className="day-panel-title">{fmtDateFull(dateStr)}</span>
        <button className="btn-add-task" onClick={() => onAdd(dateStr)}>+ 添加</button>
      </div>
      {dayTasks.length === 0 ? (
        <p className="day-panel-empty">这天没有任务</p>
      ) : (
        <div className="day-panel-list">
          {dayTasks.map(task => {
            const cat = categories.find(c => c.id === task.categoryId);
            const rec = task.recurrence?.type ?? 'none';
            return (
              <div key={task.id} className={`day-task-row${task.completed ? ' done' : ''}`}>
                <input type="checkbox" className="task-check" checked={task.completed}
                  onChange={() => onToggle(task.id)} />
                <div className="day-task-body">
                  <div className="todo-task-title-row">
                    {cat && <span className="type-dot" style={{ background: cat.color }} />}
                    <span className="task-title">{task.title}</span>
                    {rec !== 'none' && <span className="rec-badge">↻</span>}
                  </div>
                  {task.startTime && (
                    <span className="todo-task-time">
                      ⏰ {task.startTime}{task.endTime ? ` – ${task.endTime}` : ''}
                    </span>
                  )}
                </div>
                <div className="task-acts">
                  <button className="btn-act" onClick={() => onEdit(task)}>✎</button>
                  <button className="btn-act btn-act-del" onClick={() => onDelete(task.id)}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Week row ──────────────────────────────────────────────────────────────────

function WeekRow({ weekDays, tasks, categories, selectedDate, currentMonth, selectedCategoryId, onSelectDate, today }) {
  const filtered = selectedCategoryId ? tasks.filter(t => t.categoryId === selectedCategoryId) : tasks;
  const bars = useMemo(() => computeWeekBars(weekDays, filtered), [weekDays, filtered]);

  const usedLanes = Math.min(bars.reduce((m, b) => Math.max(m, b.lane), -1) + 1, MAX_LANES);
  const eventsH   = usedLanes * (BAR_H + BAR_GAP);
  const yearMonth = `${String(currentMonth[0]).padStart(4,'0')}-${String(currentMonth[1]+1).padStart(2,'0')}`;

  return (
    <div className="cal-week-row" style={{ paddingTop: eventsH }}>
      {/* Multi-day event bars */}
      {bars.filter(b => b.lane < MAX_LANES).map((bar, i) => {
        const cat   = categories.find(c => c.id === bar.task.categoryId);
        const color = cat?.color ?? 'var(--accent)';
        return (
          <div key={i} className="cal-event-bar"
            title={bar.task.title}
            style={{
              top:    bar.lane * (BAR_H + BAR_GAP),
              left:   (bar.startCol / 7 * 100) + '%',
              width:  ((bar.endCol - bar.startCol + 1) / 7 * 100) + '%',
              background: color + 'cc',
              borderRadius: `${bar.continuesLeft ? 0 : 4}px ${bar.continuesRight ? 0 : 4}px ${bar.continuesRight ? 0 : 4}px ${bar.continuesLeft ? 0 : 4}px`,
              paddingLeft:  bar.continuesLeft  ? 0 : 4,
              paddingRight: bar.continuesRight ? 0 : 4,
            }}
            onClick={e => { e.stopPropagation(); onSelectDate(bar.task.startDate); }}
          >
            {!bar.continuesLeft && <span className="cal-bar-title">{bar.task.title}</span>}
            {bar.continuesRight && <span className="cal-bar-arrow">›</span>}
          </div>
        );
      })}

      {/* Day cells */}
      <div className="cal-week-days">
        {weekDays.map((dateStr) => {
          const inMonth  = dateStr.slice(0, 7) === yearMonth;
          const isToday  = dateStr === today;
          const isSelect = dateStr === selectedDate;

          const dayTasks = getTasksForDate(filtered, dateStr).filter(t => !isSpanTask(t));
          const incomplete = dayTasks.filter(t => !t.completed);
          const complete   = dayTasks.filter(t => t.completed);
          const chips = [...incomplete, ...complete].slice(0, MAX_CHIPS);
          const extra = Math.max(0, dayTasks.length - MAX_CHIPS);

          return (
            <div
              key={dateStr}
              className={[
                'cal-day-cell',
                !inMonth   ? 'cal-other-month' : '',
                isToday    ? 'cal-is-today'    : '',
                isSelect   ? 'cal-selected'    : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDate(dateStr)}
            >
              <span className={`cal-day-num${isToday ? ' cal-today-num' : ''}`}>
                {parseInt(dateStr.slice(8), 10)}
              </span>
              <div className="cal-day-tasks">
                {chips.map(task => {
                  const cat   = categories.find(c => c.id === task.categoryId);
                  const color = cat?.color ?? 'var(--accent)';
                  return (
                    <div key={task.id} className={`cal-task-chip${task.completed ? ' done' : ''}`}
                      style={{ background: color + '28', color }}
                      onClick={e => { e.stopPropagation(); onSelectDate(dateStr); }}
                      title={task.title}>
                      {task.title}
                    </div>
                  );
                })}
                {extra > 0 && <div className="cal-more">+{extra}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main CalendarView ─────────────────────────────────────────────────────────

export default function CalendarView({
  year, month, tasks, categories, selectedDate, selectedCategoryId,
  onYearMonthChange, onSelectDate, onAddTask, onEditTask, onToggleTask, onDeleteTask,
}) {
  const today = todayStr();
  const weeks = useMemo(() => getCalendarWeeks(year, month), [year, month]);

  const prevMonth = () => month === 0  ? onYearMonthChange(year-1, 11)  : onYearMonthChange(year, month-1);
  const nextMonth = () => month === 11 ? onYearMonthChange(year+1, 0)   : onYearMonthChange(year, month+1);
  const goToday   = () => { const n = new Date(); onYearMonthChange(n.getFullYear(), n.getMonth()); onSelectDate(today); };

  return (
    <div className="cal-container">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{fmtMonthYear(year, month)}</span>
        <button className="cal-nav-btn" onClick={goToday} style={{ fontSize: 10, padding: '2px 7px', width: 'auto' }}>今</button>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="cal-dow-row">
        {DOW.map(d => <span key={d} className="cal-dow-cell">{d}</span>)}
      </div>

      <div className="cal-grid">
        {weeks.map((weekDays, wi) => (
          <WeekRow key={wi} weekDays={weekDays} tasks={tasks} categories={categories}
            selectedDate={selectedDate} currentMonth={[year, month]}
            selectedCategoryId={selectedCategoryId}
            onSelectDate={onSelectDate} today={today} />
        ))}
      </div>

      {selectedDate && (
        <DayPanel dateStr={selectedDate} tasks={tasks} categories={categories}
          onAdd={onAddTask} onEdit={onEditTask} onToggle={onToggleTask} onDelete={onDeleteTask} />
      )}
    </div>
  );
}
