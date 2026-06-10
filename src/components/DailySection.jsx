import React, { useState } from 'react';
import DailyTaskItem from './DailyTaskItem.jsx';

function fmtToday() {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'long',
  });
}

export default function DailySection({
  todayTodos, categories, onAdd, onEdit, onDelete, onToggle, onClearCompleted,
}) {
  const [expanded, setExpanded] = useState(true);

  const total  = todayTodos.length;
  const done   = todayTodos.filter(t => t.completed).length;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;

  return (
    <div className="daily-section">
      <div className="daily-header" onClick={() => setExpanded(v => !v)}>
        <span className={`chevron ${expanded ? 'open' : ''}`}>›</span>
        <div className="daily-header-info">
          <span className="daily-label">今天</span>
          <span className="daily-date">{fmtToday()}</span>
        </div>
        <span className={`daily-chip ${allDone ? 'chip-done' : ''}`}>
          {total === 0 ? '暂无任务' : allDone ? '✓ 全部完成' : `${done} / ${total}`}
        </span>
      </div>

      {expanded && (
        <div className="daily-body">
          {total > 0 && (
            <div className="daily-bar-row">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="progress-pct">{pct}%</span>
            </div>
          )}
          <div className="daily-list">
            {total === 0 ? (
              <p className="daily-empty">今天还没有任务~</p>
            ) : (
              todayTodos.map(todo => (
                <DailyTaskItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onToggle={() => onToggle(todo.id)}
                  onEdit={()   => onEdit(todo)}
                  onDelete={()  => onDelete(todo.id)}
                />
              ))
            )}
          </div>
          <div className="daily-footer">
            <button className="btn-add-daily" onClick={e => { e.stopPropagation(); onAdd(); }}>
              + 添加今日任务
            </button>
            {done > 0 && (
              <button className="btn-clear-done" onClick={e => { e.stopPropagation(); onClearCompleted(); }} title="清除已完成">
                🧹
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
