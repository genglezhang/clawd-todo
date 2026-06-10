import React from 'react';

const MOOD_INFO = {
  great: { emoji: '💖', label: '超棒',  color: '#ff6b8a' },
  ok:    { emoji: '💛', label: '一般',  color: '#f5c842' },
  tired: { emoji: '💙', label: '蔫蔫',  color: '#8aacf5' },
};

export default function MoodHeart({ mood, completionRate }) {
  const info = MOOD_INFO[mood] || MOOD_INFO.ok;
  return (
    <button
      className="mood-heart btn-wctl"
      title={`近7日心情：${info.label} | 活跃天数：${completionRate}天`}
      style={{ cursor: 'default', color: info.color }}
      tabIndex={-1}
    >
      {info.emoji}
    </button>
  );
}
