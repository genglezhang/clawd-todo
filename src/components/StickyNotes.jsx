import React from 'react';

export default function StickyNotes({ notes, onNotesChange, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <span>📝 便签</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <textarea
            className="field-input notes-area"
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="随手记点什么…"
            rows={8}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
