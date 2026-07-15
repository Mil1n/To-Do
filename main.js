import { renderApp, showUndo } from './render.js';
import { downloadTasks, loadTasks, loadTheme, readTasksFile, saveTasks, saveTheme } from './storage.js';
import { CATEGORIES, FILTERS, SORTS, addTask, clearCompletedTasks, deleteTask, toggleTask, updateTask } from './tasks.js';

const elements = {
  form: document.querySelector('#task-form'),
  input: document.querySelector('#task-input'),
  categorySelect: document.querySelector('#category-select'),
  prioritySelect: document.querySelector('#priority-select'),
  deadlineInput: document.querySelector('#deadline-input'),
  list: document.querySelector('#task-list'),
  template: document.querySelector('#task-template'),
  emptyState: document.querySelector('#empty-state'),
  totalCount: document.querySelector('#total-count'),
  doneCount: document.querySelector('#done-count'),
  activeCount: document.querySelector('#active-count'),
  progressBar: document.querySelector('#progress-bar'),
  progressText: document.querySelector('#progress-text'),
  clearDoneButton: document.querySelector('#clear-done'),
  filterButtons: document.querySelectorAll('.filter-button'),
  sortSelect: document.querySelector('#sort-select'),
  themeToggle: document.querySelector('#theme-toggle'),
  exportButton: document.querySelector('#export-json'),
  importInput: document.querySelector('#import-json'),
  editDialog: document.querySelector('#edit-dialog'),
  editForm: document.querySelector('#edit-form'),
  editTitle: document.querySelector('#edit-title'),
  editCategory: document.querySelector('#edit-category'),
  editPriority: document.querySelector('#edit-priority'),
  editDeadline: document.querySelector('#edit-deadline'),
  cancelEdit: document.querySelector('#cancel-edit'),
  undoToast: document.querySelector('#undo-toast'),
  undoText: document.querySelector('#undo-text'),
  undoButton: document.querySelector('#undo-button'),
  undoTimer: null,
};

let state = {
  tasks: loadTasks(),
  filter: FILTERS.all,
  sort: SORTS.newest,
  editingId: null,
  lastDeletedTask: null,
};

function persistAndRender() {
  saveTasks(state.tasks);
  render();
}

function render() {
  renderApp(state, elements, {
    onToggleTask: (id) => {
      state.tasks = toggleTask(state.tasks, id);
      persistAndRender();
    },
    onEditTask: openEditDialog,
    onDeleteTask: removeTaskWithUndo,
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  elements.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
  saveTheme(theme);
}

function removeTaskWithUndo(id) {
  const taskToDelete = state.tasks.find((task) => task.id === id);

  if (!taskToDelete) {
    return;
  }

  state.lastDeletedTask = taskToDelete;
  state.tasks = deleteTask(state.tasks, id);
  persistAndRender();

  showUndo(elements, taskToDelete, () => {
    state.tasks = [state.lastDeletedTask, ...state.tasks];
    state.lastDeletedTask = null;
    elements.undoToast.hidden = true;
    persistAndRender();
  });
}

function openEditDialog(task) {
  state.editingId = task.id;
  elements.editTitle.value = task.title;
  elements.editCategory.value = task.category;
  elements.editPriority.value = task.priority;
  elements.editDeadline.value = task.deadline;
  elements.editDialog.showModal();
  elements.editTitle.focus();
}

function resetForm() {
  elements.form.reset();
  elements.prioritySelect.value = 'medium';
  elements.input.focus();
}

CATEGORIES.forEach((category) => {
  const option = document.createElement('option');
  option.textContent = category;
  elements.editCategory.append(option);
});

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = elements.input.value.trim();

  if (!title) {
    elements.input.focus();
    return;
  }

  state.tasks = addTask(state.tasks, {
    title,
    category: elements.categorySelect.value,
    priority: elements.prioritySelect.value,
    deadline: elements.deadlineInput.value,
  });
  resetForm();
  persistAndRender();
});

elements.filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    render();
  });
});

elements.sortSelect.addEventListener('change', () => {
  state.sort = elements.sortSelect.value;
  render();
});

elements.clearDoneButton.addEventListener('click', () => {
  state.tasks = clearCompletedTasks(state.tasks);
  persistAndRender();
});

elements.themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

elements.exportButton.addEventListener('click', () => downloadTasks(state.tasks));

elements.importInput.addEventListener('change', async () => {
  const [file] = elements.importInput.files;

  if (!file) {
    return;
  }

  try {
    state.tasks = await readTasksFile(file);
    persistAndRender();
  } finally {
    elements.importInput.value = '';
  }
});

elements.editForm.addEventListener('submit', (event) => {
  event.preventDefault();

  state.tasks = updateTask(state.tasks, state.editingId, {
    title: elements.editTitle.value,
    category: elements.editCategory.value,
    priority: elements.editPriority.value,
    deadline: elements.editDeadline.value,
  });
  elements.editDialog.close();
  state.editingId = null;
  persistAndRender();
});

elements.cancelEdit.addEventListener('click', () => {
  elements.editDialog.close();
  state.editingId = null;
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== elements.input) {
    event.preventDefault();
    elements.input.focus();
  }

  if (event.key === 'Escape') {
    elements.input.value = '';
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js');
}

applyTheme(loadTheme());
render();
