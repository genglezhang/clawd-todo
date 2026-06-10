import React, { useState } from 'react';

const PRESET_COLORS = ['#e88a8a', '#82aee0', '#7dcea0', '#c49ad8', '#f0b87a', '#a0c8d8'];

export default function CategoryModal({ onSave, onClose }) {
  const [name,  setName]  = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <span>新建分类</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field-lbl">
            分类名称
            <input
              type="text"
              className="field-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="如：工作、学习、生活…"
              autoFocus
            />
          </label>
          <label className="field-lbl">
            颜色
            <div className="cat-color-row">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`cat-color-btn${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </label>
          <div className="modal-foot">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-save">添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}
