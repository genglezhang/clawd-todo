import React, { useMemo } from 'react';
import { TYPE_COLOR } from '../constants.js';

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
}

export default function HistoryPanel({ history, onClose }) {
  const grouped = useMemo(() => {
    const map = {};
    for (const entry of history) {
      if (!map[entry.completedAt]) map[entry.completedAt] = [];
      map[entry.completedAt].push(entry);
    }
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({ date, entries: map[date] }));
  }, [history]);

  return (
    <div className="overlay">
      <div className="modal history-panel">
        <div className="modal-hdr">
          <span>◷ 完成记录</span>
          <button className="btn-wctl btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="history-body">
          {grouped.length === 0 ? (
            <div className="history-empty">
              <div className="empty-icon" style={{ fontSize: 24 }}>◷</div>
              <p>还没有完成记录</p>
              <p style={{ fontSize: 11 }}>完成任务后会在这里显示</p>
            </div>
          ) : (
            grouped.map(({ date, entries }) => (
              <div key={date} className="history-group">
                <div className="history-date-hdr">{fmtDate(date)}</div>
                {entries.map(entry => (
                  <div key={entry.id} className="history-entry">
                    <span
                      className="type-dot"
                      style={{ background: TYPE_COLOR[entry.type] ?? '#aaa', flexShrink: 0 }}
                    />
                    <div className="history-entry-info">
                      <span className="history-entry-title">{entry.title}</span>
                      <span className="history-entry-sub">{entry.subjectName}</span>
                    </div>
                    <span className="history-check">✓</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
