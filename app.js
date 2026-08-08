const STORAGE_KEY = 'dailytracker.tasks.v1';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentFilter = 'all';

const $ = (id) => document.getElementById(id);
const taskForm = $('taskForm');
const taskInput = $('taskInput');
const priorityInput = $('priorityInput');
const timeInput = $('timeInput');
const taskList = $('taskList');
const emptyState = $('emptyState');

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function today() {
  return new Intl.DateTimeFormat(undefined, { weekday:'long', month:'long', day:'numeric', year:'numeric' }).format(new Date());
}
function priorityValue(p) { return { high: 3, medium: 2, low: 1 }[p] || 0; }
function visibleTasks() {
  let list = [...tasks];
  if (currentFilter === 'pending') list = list.filter(t => !t.done);
  if (currentFilter === 'completed') list = list.filter(t => t.done);
  const sort = $('sortSelect').value;
  if (sort === 'priority') list.sort((a,b) => priorityValue(b.priority) - priorityValue(a.priority));
  else if (sort === 'time') list.sort((a,b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  else list.sort((a,b) => b.createdAt - a.createdAt);
  return list;
}
function render() {
  $('todayLabel').textContent = today();
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const pending = total - completed;
  const high = tasks.filter(t => t.priority === 'high' && !t.done).length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  $('totalCount').textContent = total;
  $('completedCount').textContent = completed;
  $('pendingCount').textContent = pending;
  $('highCount').textContent = high;
  $('completionPercent').textContent = `${percent}%`;
  document.querySelector('.progress-ring').style.setProperty('--progress', `${percent}%`);

  const list = visibleTasks();
  taskList.innerHTML = list.map(t => `
    <article class="task ${t.done ? 'done' : ''}" data-id="${t.id}">
      <button class="check" aria-label="${t.done ? 'Mark pending' : 'Mark complete'}">${t.done ? '✓' : ''}</button>
      <div>
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          <span class="badge ${t.priority}">${t.priority}</span>
          ${t.time ? `<span class="time">◷ ${t.time}</span>` : ''}
        </div>
      </div>
      <button class="delete" aria-label="Delete task">×</button>
    </article>`).join('');
  emptyState.style.display = list.length ? 'none' : 'block';
}
function escapeHtml(value) { return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  tasks.push({ id: crypto.randomUUID(), title, priority: priorityInput.value, time: timeInput.value, done: false, createdAt: Date.now() });
  save(); render(); taskForm.reset(); priorityInput.value = 'medium'; taskInput.focus();
});

taskList.addEventListener('click', e => {
  const row = e.target.closest('.task');
  if (!row) return;
  const task = tasks.find(t => t.id === row.dataset.id);
  if (e.target.closest('.check')) task.done = !task.done;
  if (e.target.closest('.delete')) tasks = tasks.filter(t => t.id !== row.dataset.id);
  save(); render();
});

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  button.classList.add('active'); currentFilter = button.dataset.filter; render();
}));
$('sortSelect').addEventListener('change', render);
$('clearCompleted').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); save(); render(); });
$('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  $('themeToggle').textContent = document.body.classList.contains('dark') ? '☀' : '☾';
});
render();