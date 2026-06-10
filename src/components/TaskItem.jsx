import React from 'react';
import { TYPE_COLOR } from '../constants.js';

function dueDateStatus(dateStr) {
  if (!dateStr) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const due  = new Date(y, m - 1, d);
  const days = (due - today) / 86400000;
  if (days < 0) return 'overdue';
  if (days <= 2) return 'soon';
  return 'normal';
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function TaskItem({ task, progress, onToggle, onEdit, onDelete }) {
  const status = dueDateStatus(task.dueDate);
  const dot    = TYPE_COLOR[task.type] ?? '#aaa';

  const hasProg = progress && progress.total > 0;
  const pct     = hasProg ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className={`task-item${task.completed ? ' done' : ''}`}>
      <input type="checkbox" className="task-check" checked={task.completed} onChange={onToggle} />

      <div className="task-body">
        <div className="task-title-row">
          <span className="type-dot" style={{ background: dot }} title={task.type} />
          <span className="task-title">{task.title}</span>
        </div>

        {/* Progress bar — shown only when daily steps are linked */}
        {hasProg && (
          <div className="task-progress-row">
            <div className="progress-track task-prog-track">
              <div
                className="progress-fill"
                style={{ width: `${pct}%`, background: dot }}
              />
            </div>
            <span className="task-prog-label">
              {progress.done}/{progress.total} 步
            </span>
          </div>
        )}
      </div>

      <div className="task-right">
        {task.dueDate && (
          <span className={`task-due status-${status}`}>{fmtDate(task.dueDate)}</span>
        )}
        <div className="task-acts">
          <button className="btn-act" onClick={onEdit}   title="编辑">✎</button>
          <button className="btn-act btn-act-del" onClick={onDelete} title="删除">×</button>
        </div>
      </div>
    </div>
  );
}
