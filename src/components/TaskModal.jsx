import React, { useState } from 'react';

const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DEFAULT_REC = { type: 'none', weekdays: [], monthDay: 1 };

export default function TaskModal({ mode, task, defaultDate, defaultCategoryId, categories, onSave, onClose }) {
  const [title,      setTitle]      = useState(task?.title      ?? '');
  const [note,       setNote]       = useState(task?.note       ?? '');
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? defaultCategoryId ?? '');
  const [startDate,  setStartDate]  = useState(task?.startDate  ?? defaultDate ?? '');
  const [startTime,  setStartTime]  = useState(task?.startTime  ?? '');
  const [endDate,    setEndDate]    = useState(task?.endDate     ?? '');
  const [endTime,    setEndTime]    = useState(task?.endTime     ?? '');
  const [rec,        setRec]        = useState(task?.recurrence ?? DEFAULT_REC);

  const setRecType = (type) => {
    if (type === 'weekly') {
      const dow = startDate ? new Date(startDate + 'T12:00:00').getDay() : 1;
      setRec({ type, weekdays: [dow], monthDay: 1 });
    } else if (type === 'monthly') {
      const day = startDate ? new Date(startDate + 'T12:00:00').getDate() : 1;
      setRec({ type, weekdays: [], monthDay: day });
    } else {
      setRec({ type, weekdays: [], monthDay: 1 });
    }
  };

  const toggleWeekday = (dow) => {
    setRec(r => {
      const days = r.weekdays.includes(dow) ? r.weekdays.filter(d => d !== dow) : [...r.weekdays, dow];
      return { ...r, weekdays: days };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title:      title.trim(),
      note:       note.trim(),
      categoryId: categoryId || null,
      startDate:  startDate  || null,
      startTime:  startTime  || '',
      endDate:    endDate && endDate > startDate ? endDate : null,
      endTime:    endTime    || '',
      recurrence: rec,
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <span>{mode === 'add' ? '新建任务' : '编辑任务'}</span>
          <button className="btn-wctl" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>

          <label className="field-lbl">
            任务
            <input type="text" className="field-input" value={title}
              onChange={e => setTitle(e.target.value)} placeholder="任务名称…" autoFocus />
          </label>

          <label className="field-lbl">
            分类
            <div className="cat-chip-row cat-chip-scroll">
              <button type="button" className={`cat-chip${!categoryId ? ' cat-chip-selected' : ''}`}
                onClick={() => setCategoryId('')}>无</button>
              {categories.map(cat => (
                <button key={cat.id} type="button"
                  className={`cat-chip${categoryId === cat.id ? ' cat-chip-selected' : ''}`}
                  style={categoryId === cat.id
                    ? { background: cat.color + '22', borderColor: cat.color + '88', color: cat.color }
                    : {}}
                  onClick={() => setCategoryId(cat.id)}>
                  <span className="link-dot" style={{ background: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </label>

          <div className="datetime-block">
            <div className="datetime-row">
              <span className="datetime-label">开始</span>
              <input type="date" className="field-input datetime-date" value={startDate}
                onChange={e => setStartDate(e.target.value)} />
              <input type="time" className="field-input datetime-time" value={startTime}
                onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="datetime-row">
              <span className="datetime-label">结束</span>
              <input type="date" className="field-input datetime-date" value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)} />
              <input type="time" className="field-input datetime-time" value={endTime}
                onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <label className="field-lbl">
            重复
            <div className="rec-type-row">
              {['none', 'daily', 'weekly', 'monthly'].map(t => (
                <button key={t} type="button"
                  className={`type-chip${rec.type === t ? ' type-chip-active' : ''}`}
                  onClick={() => setRecType(t)}>
                  {t === 'none' ? '不重复' : t === 'daily' ? '每天' : t === 'weekly' ? '每周' : '每月'}
                </button>
              ))}
            </div>
          </label>

          {rec.type === 'weekly' && (
            <div className="rec-detail">
              <div className="dow-row">
                {DOW_LABELS.map((lbl, i) => (
                  <button key={i} type="button"
                    className={`dow-btn${rec.weekdays.includes(i) ? ' dow-active' : ''}`}
                    onClick={() => toggleWeekday(i)}>{lbl}</button>
                ))}
              </div>
            </div>
          )}

          {rec.type === 'monthly' && (
            <div className="rec-detail">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                每月第
                <input type="number" className="field-input" min={1} max={31}
                  value={rec.monthDay}
                  onChange={e => setRec(r => ({ ...r, monthDay: Number(e.target.value) }))}
                  style={{ width: 56 }} />
                日
              </div>
            </div>
          )}

          <label className="field-lbl">
            备注 <span className="field-optional">（可选）</span>
            <input type="text" className="field-input" value={note}
              onChange={e => setNote(e.target.value)} placeholder="添加备注…" />
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
