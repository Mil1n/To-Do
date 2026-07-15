const STORAGE_KEY = 'todo.tasks.v1';

const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const template = document.querySelector('#task-template');
const emptyState = document.querySelector('#empty-state');
const totalCount = document.querySelector('#total-count');
const doneCount = document.querySelector('#done-count');
const clearDoneButton = document.querySelector('#clear-done');

let tasks = loadTasks();

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title) {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

function addTask(title) {
  tasks = [createTask(title), ...tasks];
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) => (
    task.id === id ? { ...task, completed: !task.completed } : task
  ));
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function updateStats() {
  const completedCount = tasks.filter((task) => task.completed).length;
  totalCount.textContent = `Всего: ${tasks.length}`;
  doneCount.textContent = `Выполнено: ${completedCount}`;
  clearDoneButton.disabled = completedCount === 0;
}

function renderTasks() {
  list.replaceChildren();

  tasks.forEach((task) => {
    const item = template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector('.task-checkbox');
    const title = item.querySelector('.task-title');
    const deleteButton = item.querySelector('.delete-button');

    item.classList.toggle('completed', task.completed);
    checkbox.checked = task.completed;
    title.textContent = task.title;

    checkbox.addEventListener('change', () => toggleTask(task.id));
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    list.append(item);
  });

  emptyState.hidden = tasks.length > 0;
  updateStats();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = input.value.trim();

  if (!title) {
    input.focus();
    return;
  }

  addTask(title);
  form.reset();
  input.focus();
});

clearDoneButton.addEventListener('click', clearCompletedTasks);

renderTasks();
