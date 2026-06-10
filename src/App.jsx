import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_THEME, applyTheme } from './themes.js';
import { sendClawd, showBubble, trigger, pickMessage, getTimeGreeting } from './clawd.js';
import CategorySidebar from './components/CategorySidebar.jsx';
import CategoryModal   from './components/CategoryModal.jsx';
import CalendarView    from './components/CalendarView.jsx';
import TodoList        from './components/TodoList.jsx';
import TaskModal       from './components/TaskModal.jsx';
import HistoryPanel    from './components/HistoryPanel.jsx';
import ThemePanel      from './components/ThemePanel.jsx';
import PomodoroTimer   from './components/PomodoroTimer.jsx';

const api = window.electronAPI;

const DEFAULT_CATEGORIES = [
  { id: 'cat-work',  name: '工作', color: '#e88a8a' },
  { id: 'cat-study', name: '学习', color: '#82aee0' },
  { id: 'cat-life',  name: '生活', color: '#7dcea0' },
];

const WIDE_BREAKPOINT = 700;
const DEFAULT_CATEGORY_IDS = new Set(['cat-work', 'cat-study', 'cat-life']);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function migrateDailyTodos(dailyTodos) {
  const tasks = [];
  for (const [date, todos] of Object.entries(dailyTodos)) {
    for (const todo of todos) {
      tasks.push({
        id: todo.id, title: todo.title,
        categoryId: null, note: todo.note ?? '',
        completed: todo.completed ?? false, completedAt: todo.completedAt ?? null,
        startDate: date, startTime: '', endDate: null, endTime: '',
        recurrence: { type: 'none', weekdays: [], monthDay: 1 },
      });
    }
  }
  return tasks;
}

export default function App() {
  const [tasks,              setTasks]              = useState([]);
  const [categories,         setCategories]         = useState(DEFAULT_CATEGORIES);
  const [loaded,             setLoaded]             = useState(false);
  const [theme,              setTheme]              = useState(DEFAULT_THEME);
  const [opacity,            setOpacityState]       = useState(1.0);
  const [scale,              setScaleState]         = useState(1.0);
  const [showThemePanel,     setShowThemePanel]     = useState(false);
  const [showAddCategory,    setShowAddCategory]    = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [taskModal,          setTaskModal]          = useState(null);
  const [history,            setHistory]            = useState([]);
  const [reminderModal,      setReminderModal]      = useState(null);
  const [calYear,            setCalYear]            = useState(() => new Date().getFullYear());
  const [calMonth,           setCalMonth]           = useState(() => new Date().getMonth());
  const [selectedDate,       setSelectedDate]       = useState(todayKey);
  const [windowWidth,        setWindowWidth]        = useState(() => window.innerWidth);
  const [catCtxMenu,         setCatCtxMenu]         = useState(null);
  const [catRenameModal,     setCatRenameModal]     = useState(null);
  const [catDeleteConfirm,   setCatDeleteConfirm]   = useState(null);

  const isWide = windowWidth >= WIDE_BREAKPOINT;

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const lastCompletionRef    = useRef(0);
  const consecutiveRef       = useRef(0);
  const appStartRef          = useRef(Date.now());
  const idleNotifiedRef      = useRef(false);
  const overnightNotifiedRef = useRef(false);
  const lastSummaryDateRef   = useRef(null);
  const restCountRef         = useRef(0);
  const lastChimeHourRef     = useRef(-1);
  const tasksRef             = useRef(tasks);
  const greetedRef           = useRef(false);

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // ── Boot ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([api.readData(), api.readSettings(), api.readHistory()]).then(([data, settings, hist]) => {
      // Categories: always use saved categories; if none saved, use defaults
      if (Array.isArray(data?.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
      // (Don't migrate old subjects — just use DEFAULT_CATEGORIES for a clean start)

      // Tasks
      if (Array.isArray(data?.tasks)) {
        setTasks(data.tasks);
      } else if (data?.dailyTodos) {
        setTasks(migrateDailyTodos(data.dailyTodos));
      }

      if (Array.isArray(hist)) setHistory(hist);

      const t  = settings?.theme   ?? DEFAULT_THEME;
      const op = settings?.opacity ?? 1.0;
      const sc = settings?.uiScale ?? 1.0;

      setTheme(t); applyTheme(t, op);
      setOpacityState(op);
      setScaleState(sc); document.documentElement.style.zoom = sc;
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded || greetedRef.current) return;
    greetedRef.current = true;
    setTimeout(() => { sendClawd('happy'); showBubble(getTimeGreeting()); }, 1200);
  }, [loaded]);

  // ── Persist ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loaded) api.writeData({ categories, tasks });
  }, [categories, tasks, loaded]);

  useEffect(() => { if (loaded) api.writeHistory(history); }, [history, loaded]);

  // ── Appearance ────────────────────────────────────────────────────────────────

  const changeTheme = (name) => {
    setTheme(name); applyTheme(name, opacity);
    api.writeSettings({ theme: name });
  };
  const changeOpacity = (val) => {
    setOpacityState(val); applyTheme(theme, val);
    if (api.setOpacity) api.setOpacity(val);
    api.writeSettings({ opacity: val });
  };
  const changeScale = (val) => {
    setScaleState(val);
    document.documentElement.style.zoom = val;
    api.writeSettings({ uiScale: val });
  };

  // ── Task completion ───────────────────────────────────────────────────────────

  const handleTaskCompleted = (isAllDone) => {
    lastCompletionRef.current = Date.now();
    idleNotifiedRef.current = false;
    if (isAllDone) { trigger('happy', pickMessage('allDone')); consecutiveRef.current = 0; return; }
    consecutiveRef.current++;
    if (consecutiveRef.current >= 3) { consecutiveRef.current = 0; trigger('building'); }
    else trigger('happy');
  };

  // ── Periodic timer ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      const now  = Date.now();
      const d    = new Date();
      const hour = d.getHours();
      const min  = d.getMinutes();
      const today = todayKey();

      if (lastCompletionRef.current && now - lastCompletionRef.current > 30 * 60 * 1000)
        consecutiveRef.current = 0;
      if (lastCompletionRef.current && now - lastCompletionRef.current > 30 * 60 * 1000 && !idleNotifiedRef.current) {
        idleNotifiedRef.current = true; trigger('notification');
      }
      if (hour >= 23 && !overnightNotifiedRef.current) { overnightNotifiedRef.current = true; trigger('sleeping'); }
      if (hour < 23) overnightNotifiedRef.current = false;
      if (hour >= 23 && lastSummaryDateRef.current !== today) {
        lastSummaryDateRef.current = today;
        const doneCount = tasksRef.current.filter(t => t.completedAt === today).length;
        sendClawd('happy');
        setReminderModal({ emoji: '📊', text: `今天完成了 ${doneCount} 个任务，辛苦啦！` });
      }
      const expected = Math.floor((now - appStartRef.current) / (4 * 60 * 60 * 1000));
      if (expected > restCountRef.current) {
        restCountRef.current = expected;
        trigger('sleeping');
        setReminderModal({ emoji: '☕', text: '已经连续学习4小时啦，休息一下眼睛吧~' });
      }
      if (min === 0 && lastChimeHourRef.current !== hour) {
        lastChimeHourRef.current = hour;
        showBubble(`现在 ${hour} 点啦~ 进度怎么样？`, 4000);
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [loaded]); // eslint-disable-line

  // ── Category CRUD ─────────────────────────────────────────────────────────────

  const addCategory = (data) => setCategories(p => [...p, { id: uuidv4(), ...data }]);

  const renameCategory = (id, name) => {
    setCategories(cs => cs.map(c => c.id === id ? { ...c, name } : c));
    setCatRenameModal(null);
  };
  const deleteCategory = (id) => {
    setCategories(cs => cs.filter(c => c.id !== id));
    setTasks(ts => ts.map(t => t.categoryId === id ? { ...t, categoryId: null } : t));
    if (selectedCategoryId === id) setSelectedCategoryId(null);
    setCatDeleteConfirm(null);
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────────

  const addTask = useCallback((data) => {
    trigger('typing');
    setTasks(p => [...p, {
      id: uuidv4(), completed: false, completedAt: null,
      startDate: null, startTime: '', endDate: null, endTime: '',
      recurrence: { type: 'none', weekdays: [], monthDay: 1 },
      categoryId: null, note: '',
      ...data,
    }]);
  }, []);

  const updateTask = useCallback((id, data) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTask = useCallback((id) => {
    showBubble('这个不要啦？好的~', 2000);
    setTasks(p => p.filter(t => t.id !== id));
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const newCompleted = !task.completed;
      const today = todayKey();
      const next = prev.map(t =>
        t.id === id ? { ...t, completed: newCompleted, completedAt: newCompleted ? today : null } : t
      );
      if (newCompleted) {
        const remaining = next.filter(t => !t.completed).length;
        handleTaskCompleted(remaining === 0);
      }
      return next;
    });
  }, []); // eslint-disable-line

  const handleSaveTask = (data) => {
    if (taskModal.mode === 'add') addTask(data);
    else updateTask(taskModal.task.id, data);
    setTaskModal(null);
  };

  const handleClose = () => {
    sendClawd('sleeping');
    showBubble('拜拜！记得早睡哦~', 2200);
    setTimeout(() => api.close(), 2200);
  };

  // ── Derive view state ─────────────────────────────────────────────────────────

  const today = todayKey();
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Today mode: tasks with startDate === today
  // Category mode: all tasks in that category
  const sortByTime = (arr) => [...arr].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });

  const displayTasks = selectedCategoryId
    ? tasks.filter(t => t.categoryId === selectedCategoryId)
    : sortByTime(tasks.filter(t => t.startDate === today));

  const viewMode = selectedCategoryId ? 'category' : 'today';
  const listTitle = selectedCategory ? selectedCategory.name : '今日待办';

  // ── Render ────────────────────────────────────────────────────────────────────

  const todoPanel = (
    <TodoList
      tasks={displayTasks}
      title={listTitle}
      viewMode={viewMode}
      categories={categories}
      onAdd={(date) => setTaskModal({
        mode: 'add',
        defaultDate: date,
        defaultCategoryId: selectedCategoryId,
      })}
      onEdit={(task) => setTaskModal({ mode: 'edit', task })}
      onToggle={toggleTask}
      onDelete={deleteTask}
    />
  );

  const calPanel = (
    <CalendarView
      year={calYear}
      month={calMonth}
      tasks={tasks}
      categories={categories}
      selectedDate={selectedDate}
      selectedCategoryId={selectedCategoryId}
      onYearMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
      onSelectDate={setSelectedDate}
      onAddTask={(date) => setTaskModal({ mode: 'add', defaultDate: date, defaultCategoryId: selectedCategoryId })}
      onEditTask={(task) => setTaskModal({ mode: 'edit', task })}
      onToggleTask={toggleTask}
      onDeleteTask={deleteTask}
    />
  );

  return (
    <div className="widget">

      <div className="title-bar">
        <span className="title-icon">✦</span>
        <span className="title-text">{listTitle}</span>
        <div className="title-actions">
          <PomodoroTimer
            onBubble={(text, dur) => showBubble(text, dur)}
            onClawd={(type) => sendClawd(type)}
          />
          <button
            className={`btn-wctl btn-theme${showThemePanel ? ' active' : ''}`}
            onClick={() => setShowThemePanel(v => !v)}
            title="外观设置"
          >◑</button>
          <button className="btn-wctl" onClick={() => api.minimize()} title="最小化">─</button>
          <button className="btn-wctl btn-close" onClick={handleClose} title="关闭">✕</button>
        </div>
      </div>

      <div className="widget-body">
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onAdd={() => setShowAddCategory(true)}
          onContextMenu={(catId, catName, x, y) => setCatCtxMenu({ catId, catName, x, y })}
        />

        {!isWide ? (
          /* Narrow: only todo */
          <div className="main-content">{todoPanel}</div>
        ) : (
          /* Wide: todo + calendar side by side */
          <>
            <div className="main-content todo-panel">{todoPanel}</div>
            <div className="main-content cal-panel cal-scroll">{calPanel}</div>
          </>
        )}
      </div>

      {showThemePanel && (
        <ThemePanel
          currentTheme={theme}
          onThemeChange={changeTheme}
          opacity={opacity}
          onOpacityChange={changeOpacity}
          onClose={() => setShowThemePanel(false)}
        />
      )}
      {showAddCategory && (
        <CategoryModal
          onSave={(data) => { addCategory(data); setShowAddCategory(false); }}
          onClose={() => setShowAddCategory(false)}
        />
      )}
      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          task={taskModal.task}
          defaultDate={taskModal.defaultDate}
          defaultCategoryId={taskModal.defaultCategoryId}
          categories={categories}
          onSave={handleSaveTask}
          onClose={() => setTaskModal(null)}
        />
      )}
      {reminderModal && (
        <div className="reminder-overlay">
          <div className="reminder-card">
            <div className="reminder-emoji">{reminderModal.emoji}</div>
            <div className="reminder-text">{reminderModal.text}</div>
            <button className="reminder-btn" onClick={() => setReminderModal(null)}>好的~</button>
          </div>
        </div>
      )}

      {catCtxMenu && (
        <div className="cat-ctx-overlay" onClick={() => setCatCtxMenu(null)}>
          <div className="cat-ctx-menu"
            style={{ top: Math.min(catCtxMenu.y, window.innerHeight - 80), left: 36 }}
            onClick={e => e.stopPropagation()}>
            <button className="cat-ctx-item" onClick={() => {
              setCatRenameModal({ id: catCtxMenu.catId, name: catCtxMenu.catName });
              setCatCtxMenu(null);
            }}>重命名</button>
            {!DEFAULT_CATEGORY_IDS.has(catCtxMenu.catId) && (
              <button className="cat-ctx-item cat-ctx-del" onClick={() => {
                const cnt = tasks.filter(t => t.categoryId === catCtxMenu.catId).length;
                if (cnt > 0) setCatDeleteConfirm({ id: catCtxMenu.catId, name: catCtxMenu.catName, count: cnt });
                else deleteCategory(catCtxMenu.catId);
                setCatCtxMenu(null);
              }}>删除</button>
            )}
          </div>
        </div>
      )}

      {catRenameModal && (
        <div className="overlay" onClick={() => setCatRenameModal(null)} style={{ zIndex: 300 }}>
          <div className="modal" style={{ width: 220 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <span>重命名</span>
              <button className="btn-wctl" onClick={() => setCatRenameModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <input type="text" className="field-input" value={catRenameModal.name} autoFocus
                onChange={e => setCatRenameModal(r => ({ ...r, name: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && catRenameModal.name.trim())
                    renameCategory(catRenameModal.id, catRenameModal.name.trim());
                  if (e.key === 'Escape') setCatRenameModal(null);
                }} />
              <div className="modal-foot">
                <button className="btn-cancel" onClick={() => setCatRenameModal(null)}>取消</button>
                <button className="btn-save" onClick={() => {
                  if (catRenameModal.name.trim()) renameCategory(catRenameModal.id, catRenameModal.name.trim());
                }}>确定</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {catDeleteConfirm && (
        <div className="overlay" onClick={() => setCatDeleteConfirm(null)} style={{ zIndex: 300 }}>
          <div className="modal" style={{ width: 240 }} onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <span>确认删除</span>
              <button className="btn-wctl" onClick={() => setCatDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                该分类下有 <strong>{catDeleteConfirm.count}</strong> 个任务，删除后任务将移入"其他"，确认删除？
              </p>
              <div className="modal-foot">
                <button className="btn-cancel" onClick={() => setCatDeleteConfirm(null)}>取消</button>
                <button className="btn-save"
                  style={{ background: 'rgba(184,72,72,0.10)', borderColor: 'rgba(184,72,72,0.40)', color: '#b84848' }}
                  onClick={() => deleteCategory(catDeleteConfirm.id)}>删除</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
