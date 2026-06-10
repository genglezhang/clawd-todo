import React, { useState } from 'react';

export default function SubjectModal({ onSave, onClose }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hdr">
          <span>新建科目</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field-lbl">
            科目名称
            <input
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：数学、计算机 101…"
              autoFocus
            />
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
