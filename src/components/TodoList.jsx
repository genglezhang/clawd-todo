import React, { useState } from 'react';
import { addDays } from '../utils/recurrence.js';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const GROUP_META = {
  overdue:  { label: '逾期',   color: '#b84848' },
  today:    { label: '今天',   color: 'var(--accent)' },
  tomorrow: { label: '明天',   color: 'var(--text-secondary)' },
  week:     { label: '本周',   color: 'var(--text-secondary)' },
  later:    { label: '以后',   color: 'var(--text-muted)' },
  noDate:   { label: '无日期', color: 'var(--text-muted)' },
  done:     { label: '已完成', color: 'var(--text-muted)' },
};

function groupByDate(tasks) {
  const today    = todayStr();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  const groups = { overdue: [], today: [], tomorrow: [], week: [], later: [], noDate: [], done: [] };
  for (const t of tasks) {
    if (t.completed) { groups.done.push(t); continue; }
    const d = t.startDate;
    if (!d)          { groups.noDate.push(t);   continue; }
    if (d < today)   { groups.overdue.push(t);  continue; }
    if (d === today) { groups.today.push(t);    continue; }
    if (d === tomorrow) { groups.tomorrow.push(t); continue; }
    if (d <= nextWeek)  { groups.week.push(t);   continue; }
    groups.later.push(t);
  }
  return groups;
}

function TaskRow({ task, categories, onToggle, onEdit, onDelete }) {
  const cat = categories.find(c => c.id === task.categoryId);
  const rec = task.recurrence?.type ?? 'none';
  return (
    <div className={`todo-task-row${task.completed ? ' done' : ''}`}>
      <input type="checkbox" className="task-check" checked={task.completed}
        onChange={() => onToggle(task.id)} />
      <div className="todo-task-body">
        <div className="todo-task-title-row">
          {cat && <span className="type-dot" style={{ background: cat.color }} />}
          {task.startTime && (
            <span className="todo-task-time-inline">
              {task.startTime}{task.endTime ? `–${task.endTime}` : ''}
            </span>
          )}
          <span className="task-title">{task.title}</span>
          {rec !== 'none' && <span className="rec-badge" title="周期任务">↻</span>}
        </div>
        {task.note && (
          <div className="todo-task-meta">
            <span className="todo-task-note">{task.note}</span>
          </div>
        )}
      </div>
      <div className="task-acts">
        <button className="btn-act" onClick={() => onEdit(task)} title="编辑">✎</button>
        <button className="btn-act btn-act-del" onClick={() => onDelete(task.id)} title="删除">×</button>
      </div>
    </div>
  );
}

function sortByTime(arr) {
  return [...arr].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });
}

export default function TodoList({
  tasks, title, viewMode, categories, onAdd, onEdit, onToggle, onDelete,
}) {
  const [showDone, setShowDone] = useState(false);
  const today = todayStr();

  // today mode: flat list (today's tasks only)
  // category mode: grouped by date
  const isToday = viewMode === 'today';

  return (
    <div className="todo-container">
      <div className="todo-header">
        <span className="todo-title">{title}</span>
        <button className="btn-add-task" onClick={() => onAdd(today)}>+ 新建</button>
      </div>

      <div className="todo-scroll">
        {isToday ? (
          /* ── Today mode: flat list ── */
          <>
            {(() => {
              const active = sortByTime(tasks.filter(t => !t.completed));
              const done   = tasks.filter(t => t.completed);
              if (active.length === 0 && done.length === 0)
                return <div className="todo-empty"><div className="empty-icon">✓</div><p>今天没有任务~</p></div>;
              return (
                <>
                  {active.map(t => (
                    <TaskRow key={t.id} task={t} categories={categories}
                      onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                  {done.length > 0 && (
                    <div className="todo-section">
                      <div className="todo-section-hdr"
                        style={{ color: GROUP_META.done.color, cursor: 'pointer' }}
                        onClick={() => setShowDone(v => !v)}>
                        已完成
                        <span className="todo-section-count">{done.length}</span>
                        <span style={{ marginLeft: 4, fontSize: 10 }}>{showDone ? '▴' : '▾'}</span>
                      </div>
                      {showDone && done.map(t => (
                        <TaskRow key={t.id} task={t} categories={categories}
                          onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          /* ── Category mode: grouped by date ── */
          (() => {
            const groups = groupByDate(tasks);
            const ORDER = ['overdue','today','tomorrow','week','later','noDate'];
            const hasAny = ORDER.some(k => groups[k].length > 0) || groups.done.length > 0;
            if (!hasAny) return (
              <div className="todo-empty"><div className="empty-icon">✓</div><p>该分类下没有任务</p></div>
            );
            return (
              <>
                {ORDER.map(key => {
                  const items = groups[key];
                  if (!items.length) return null;
                  const meta = GROUP_META[key];
                  return (
                    <div key={key} className="todo-section">
                      <div className="todo-section-hdr" style={{ color: meta.color }}>
                        {meta.label}
                        <span className="todo-section-count">{items.length}</span>
                      </div>
                      {items.map(t => (
                        <TaskRow key={t.id} task={t} categories={categories}
                          onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                    </div>
                  );
                })}
                {groups.done.length > 0 && (
                  <div className="todo-section">
                    <div className="todo-section-hdr"
                      style={{ color: GROUP_META.done.color, cursor: 'pointer' }}
                      onClick={() => setShowDone(v => !v)}>
                      已完成
                      <span className="todo-section-count">{groups.done.length}</span>
                      <span style={{ marginLeft: 4, fontSize: 10 }}>{showDone ? '▴' : '▾'}</span>
                    </div>
                    {showDone && groups.done.map(t => (
                      <TaskRow key={t.id} task={t} categories={categories}
                        onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
