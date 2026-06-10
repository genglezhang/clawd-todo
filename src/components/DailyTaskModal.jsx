import React, { useState } from 'react';

export default function DailyTaskModal({ mode, todo, categories, defaultCategoryId, onSave, onClose }) {
  const [title,      setTitle]      = useState(todo?.title      ?? '');
  const [note,       setNote]       = useState(todo?.note       ?? '');
  const [categoryId, setCategoryId] = useState(todo?.categoryId ?? defaultCategoryId ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), note: note.trim(), categoryId: categoryId || null });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <span>{mode === 'add' ? '新建今日任务' : '编辑今日任务'}</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field-lbl">
            任务
            <input
              type="text"
              className="field-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="今天要做什么？"
              autoFocus
            />
          </label>
          <label className="field-lbl">
            分类
            <div className="cat-chip-row">
              <button
                type="button"
                className={`cat-chip${!categoryId ? ' cat-chip-selected' : ''}`}
                onClick={() => setCategoryId('')}
              >无</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`cat-chip${categoryId === cat.id ? ' cat-chip-selected' : ''}`}
                  style={categoryId === cat.id
                    ? { background: cat.color + '22', borderColor: cat.color + '88', color: cat.color }
                    : {}}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <span className="link-dot" style={{ background: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </label>
          <label className="field-lbl">
            备注 <span className="field-optional">（可选）</span>
            <input
              type="text"
              className="field-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="添加备注…"
            />
          </label>
          <div className="modal-foot">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-save">{mode === 'add' ? '添加' : '保存'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
