import React from 'react';
import { MILESTONES } from '../clawd.js';

export default function AchievementWall({ totalCompleted, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="achievement-panel" onClick={e => e.stopPropagation()}>

        <div className="modal-hdr">
          <span>🏆 成就墙</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>

        <div className="achievement-body">
          <p className="ach-total">累计完成 <strong>{totalCompleted}</strong> 个任务</p>

          {MILESTONES.map(m => {
            const unlocked = totalCompleted >= m.count;
            return (
              <div key={m.count} className={`ach-item ${unlocked ? 'ach-unlocked' : 'ach-locked'}`}>
                <span className="ach-emoji">{unlocked ? m.emoji : '🔒'}</span>
                <div className="ach-info">
                  <div className="ach-title">{m.title}</div>
                  <div className="ach-desc">
                    {unlocked ? m.desc : `完成 ${m.count} 个任务解锁`}
                  </div>
                </div>
                {unlocked && <span className="ach-check">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
