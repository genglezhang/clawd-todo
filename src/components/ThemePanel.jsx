import React, { useState, useEffect } from 'react';
import { THEMES, THEME_KEYS } from '../themes.js';

const api = window.electronAPI;

export default function ThemePanel({ currentTheme, onThemeChange, opacity, onOpacityChange, onClose }) {
  const [startup, setStartup] = useState(false);

  useEffect(() => {
    api.getStartup().then(setStartup).catch(() => {});
  }, []);

  const toggleStartup = async () => {
    const next = !startup;
    setStartup(next);
    await api.setStartup(next);
  };

  const pct = Math.round(opacity * 100);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="theme-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <span>外观设置</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>
        <div className="theme-panel-body">

          <p className="panel-label">主题</p>
          <div className="swatch-grid">
            {THEME_KEYS.map(key => {
              const t = THEMES[key];
              return (
                <button key={key}
                  className={`swatch-btn${currentTheme === key ? ' swatch-active' : ''}`}
                  onClick={() => onThemeChange(key)} title={t.name}>
                  <span className="swatch-circle" style={{ background: t.swatch }} />
                  <span className="swatch-name">{t.name}</span>
                </button>
              );
            })}
          </div>

          <div className="panel-divider" />

          <div className="panel-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span className="panel-label" style={{ margin: 0 }}>透明度</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{pct}%</span>
            </div>
            <input
              type="range" min={40} max={100} step={5} value={pct}
              className="opacity-slider"
              onChange={e => onOpacityChange(Number(e.target.value) / 100)}
            />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              低于 100% 时背景变为半透明磨砂玻璃效果
            </span>
          </div>

          <div className="panel-divider" />

          <p className="panel-label">偏好</p>
          <div className="panel-row">
            <div className="panel-row-info">
              <span className="panel-row-title">开机自启</span>
              <span className="panel-row-sub">Windows 启动时自动打开</span>
            </div>
            <button className={`toggle${startup ? ' toggle-on' : ''}`} onClick={toggleStartup}>
              <span className="toggle-thumb" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
