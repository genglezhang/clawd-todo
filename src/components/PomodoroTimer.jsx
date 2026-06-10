import React, { useState, useEffect, useRef } from 'react';

const FOCUS_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function PomodoroTimer({ onBubble, onClawd }) {
  const [phase,    setPhase]    = useState('idle');
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECS);
  const [rounds,   setRounds]   = useState(0);

  const stateRef = useRef({ phase: 'idle', timeLeft: FOCUS_SECS });
  const timerRef = useRef(null);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startInterval = (p, duration, onDone) => {
    stopTimer();
    stateRef.current = { phase: p, timeLeft: duration };
    setPhase(p);
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      stateRef.current.timeLeft--;
      setTimeLeft(stateRef.current.timeLeft);
      if (stateRef.current.timeLeft <= 0) { stopTimer(); onDone(); }
    }, 1000);
  };

  const startBreak = () => {
    startInterval('break', BREAK_SECS, () => {
      setPhase('idle'); setTimeLeft(FOCUS_SECS);
      stateRef.current.phase = 'idle';
      onBubble('☕ 休息结束！准备好下一轮了吗？', 3500);
    });
  };

  const startFocus = () => {
    onClawd('pomodoro-start');
    onBubble('🍅 专注时间开始！25分钟加油！', 3500);
    startInterval('focus', FOCUS_SECS, () => {
      setRounds(r => r + 1);
      onClawd('happy');
      onBubble('🎉 番茄钟完成！休息5分钟吧~', 4000);
      startBreak();
    });
  };

  const stop = () => {
    stopTimer(); onClawd('pomodoro-stop');
    setPhase('idle'); setTimeLeft(FOCUS_SECS);
    stateRef.current = { phase: 'idle', timeLeft: FOCUS_SECS };
  };

  useEffect(() => () => stopTimer(), []);

  if (phase === 'idle') {
    return (
      <button className="btn-wctl" onClick={startFocus} title="开启25分钟番茄钟">🍅</button>
    );
  }

  return (
    <div className="pomo-titlebar" title={phase === 'focus' ? '专注中' : '休息中'}>
      <span>{phase === 'focus' ? '🍅' : '☕'}</span>
      <span className="pomo-tb-time">{fmt(timeLeft)}</span>
      {rounds > 0 && <span className="pomo-tb-rounds">×{rounds}</span>}
      <button className="btn-wctl btn-pomo-stop-sm" onClick={stop} title="停止">■</button>
    </div>
  );
}
