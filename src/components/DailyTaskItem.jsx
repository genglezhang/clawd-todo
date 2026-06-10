import React from 'react';

export default function DailyTaskItem({ todo, categories, onToggle, onEdit, onDelete }) {
  const cat = categories?.find(c => c.id === todo.categoryId);

  return (
    <div className={`daily-task-item${todo.completed ? ' done' : ''}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={todo.completed}
        onChange={onToggle}
      />
      <div className="daily-task-body">
        <span className="task-title">{todo.title}</span>
        {cat && (
          <span
            className="link-badge"
            style={{ background: cat.color + '1a', borderColor: cat.color + '55', color: cat.color }}
          >
            <span className="link-dot" style={{ background: cat.color }} />
            {cat.name}
          </span>
        )}
        {todo.note && <span className="daily-note">{todo.note}</span>}
      </div>
      <div className="task-acts">
        <button className="btn-act" onClick={onEdit} title="编辑">✎</button>
        <button className="btn-act btn-act-del" onClick={onDelete} title="删除">×</button>
      </div>
    </div>
  );
}
