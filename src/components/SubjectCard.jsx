import React, { useState } from 'react';
import TaskItem from './TaskItem.jsx';

export default function SubjectCard({
  subject,
  isFirst,
  isLast,
  progressByTaskId,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  onClearCompleted,
}) {
  const [expanded, setExpanded] = useState(true);

  const sortedTasks = [...subject.tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const pendingCount   = subject.tasks.filter((t) => !t.completed).length;
  const completedCount = subject.tasks.filter((t) =>  t.completed).length;

  const handleDelete = () => {
    if (subject.tasks.length === 0 || window.confirm(`Delete "${subject.name}" and all its tasks?`))
      onDelete();
  };

  return (
    <div className="subject-card">
      <div className="subject-header">
        <button className="btn-chevron" onClick={() => setExpanded((v) => !v)}>
          <span className={`chevron ${expanded ? 'open' : ''}`}>›</span>
        </button>

        <span className="subject-name" onClick={() => setExpanded((v) => !v)}>
          {subject.name}
        </span>

        {pendingCount > 0 && <span className="badge">{pendingCount}</span>}

        <div className="subject-btns">
          <button className="btn-xs" onClick={onMoveUp}   disabled={isFirst} title="上移">↑</button>
          <button className="btn-xs" onClick={onMoveDown} disabled={isLast}  title="下移">↓</button>
          <button className="btn-xs btn-xs-add" onClick={onAddTask}    title="添加任务">+</button>
          {completedCount > 0 && (
            <button className="btn-xs btn-xs-sweep" onClick={onClearCompleted} title="清除已完成">🧹</button>
          )}
          <button className="btn-xs btn-xs-del" onClick={handleDelete} title="删除科目">×</button>
        </div>
      </div>

      {expanded && (
        <div className="task-list">
          {sortedTasks.length === 0 ? (
            <p className="no-tasks">
              空空的 — <button className="btn-link" onClick={onAddTask}>添加任务</button>
            </p>
          ) : (
            sortedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                progress={progressByTaskId?.[task.id] ?? null}
                onToggle={() => onToggleTask(task.id)}
                onEdit={()   => onEditTask(task)}
                onDelete={()  => onDeleteTask(task.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
