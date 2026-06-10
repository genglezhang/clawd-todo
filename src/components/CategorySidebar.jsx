import React from 'react';

export default function CategorySidebar({ categories, selectedId, onSelect, onAdd, onContextMenu }) {
  return (
    <div className="cat-sidebar">
      <button
        className={`cat-btn${selectedId === null ? ' cat-selected' : ''}`}
        onClick={() => onSelect(null)}
        title="今日待办"
      >
        <span className="cat-today-label">今</span>
      </button>

      <div className="cat-sidebar-divider" />

      <div className="cat-list">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-btn${selectedId === cat.id ? ' cat-selected' : ''}`}
            onClick={() => onSelect(selectedId === cat.id ? null : cat.id)}
            onContextMenu={e => { e.preventDefault(); onContextMenu?.(cat.id, cat.name, e.clientX, e.clientY); }}
            title={cat.name}
          >
            <span className="cat-dot" style={{ background: cat.color }} />
          </button>
        ))}
      </div>

      <button className="cat-btn cat-add" onClick={onAdd} title="添加分类">+</button>
    </div>
  );
}
