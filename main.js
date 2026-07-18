import { renderApp, renderCategories, showUndo } from './render.js';
import {
  downloadTasks,
  loadAccent,
  loadCategories,
  loadTasks,
  loadTheme,
  readTasksFile,
  saveAccent,
  saveCategories,
  saveTasks,
  saveTheme,
} from './storage.js';
import {
  FILTERS,
  SORTS,
  addTask,
  clearCompletedTasks,
  deleteManyTasks,
  deleteTask,
  moveTask,
  toggleTask,
  updateManyTasks,
  updateTask,
} from './tasks.js';

const elements = {
  form: document.querySelector('#task-form'),
  input: document.querySelector('#task-input'),
  categorySelect: document.querySelector('#category-select'),
  prioritySelect: document.querySelector('#priority-select'),
  deadlineInput: document.querySelector('#deadline-input'),
  repeatSelect: document.querySelector('#repeat-select'),
  searchInput: document.querySelector('#search-input'),
  categoryForm: document.querySelector('#category-form'),
  newCategoryInput: document.querySelector('#new-category-input'),
  accentInput: document.querySelector('#accent-input'),
  list: document.querySelector('#task-list'),
  template: document.querySelector('#task-template'),
  emptyState: document.querySelector('#empty-state'),
  totalCount: document.querySelector('#total-count'),
  doneCount: document.querySelector('#done-count'),
  activeCount: document.querySelector('#active-count'),
  todayCount: document.querySelector('#today-count'),
  overdueCount: document.querySelector('#overdue-count'),
  progressBar: document.querySelector('#progress-bar'),
  progressText: document.querySelector('#progress-text'),
  clearDoneButton: document.querySelector('#clear-done'),
  bulkCompleteButton: document.querySelector('#bulk-complete'),
  bulkDeleteButton: document.querySelector('#bulk-delete'),
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
  editRepeat: document.querySelector('#edit-repeat'),
  cancelEdit: document.querySelector('#cancel-edit'),
  completedToday: document.querySelector('#completed-today'),
  completedWeek: document.querySelector('#completed-week'),
  bestCategory: document.querySelector('#best-category'),
  offlineStatus: document.querySelector('#offline-status'),
  updateApp: document.querySelector('#update-app'),
  undoToast: document.querySelector('#undo-toast'),
  undoText: document.querySelector('#undo-text'),
  undoButton: document.querySelector('#undo-button'),
  undoTimer: null,
};

let state = {
  categories: loadCategories(),
  tasks: [],
  filter: FILTERS.all,
  sort: SORTS.manual,
  query: '',
  editingId: null,
  selectedIds: new Set(),
  draggedId: null,
  lastSnapshot: null,
};

state.tasks = loadTasks(state.categories);

function snapshot() {
  state.lastSnapshot = {
    tasks: structuredClone(state.tasks),
    selectedIds: new Set(state.selectedIds),
  };
}

function restoreSnapshot() {
  if (!state.lastSnapshot) {
    return;
  }

  state.tasks = state.lastSnapshot.tasks;
  state.selectedIds = state.lastSnapshot.selectedIds;
  state.lastSnapshot = null;
  elements.undoToast.hidden = true;
  persistAndRender();
}

function persistAndRender() {
  saveTasks(state.tasks);
  render();
}

function render() {
  renderCategories(elements, state.categories);
  renderApp(state, elements, {
    onToggleTask: (id) => {
      snapshot();
      state.tasks = toggleTask(state.tasks, id);
      persistAndRender();
    },
    onSelectTask: (id) => {
      if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
      } else {
        state.selectedIds.add(id);
      }
      render();
    },
    onEditTask: openEditDialog,
    onDeleteTask: removeTaskWithUndo,
    onDragStart: (event, id) => {
      state.draggedId = id;
      event.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (event) => {
      event.preventDefault();
    },
    onDrop: (event, targetId) => {
      event.preventDefault();
      if (!state.draggedId) {
        return;
      }
      snapshot();
      state.tasks = moveTask(state.tasks, state.draggedId, targetId);
      state.sort = SORTS.manual;
      state.draggedId = null;
      persistAndRender();
    },
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  elements.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
  saveTheme(theme);
}

function applyAccent(color) {
  document.documentElement.style.setProperty('--primary', color);
  elements.accentInput.value = color;
  saveAccent(color);
}

function removeTaskWithUndo(id) {
  const taskToDelete = state.tasks.find((task) => task.id === id);

  if (!taskToDelete) {
    return;
  }

  snapshot();
  state.tasks = deleteTask(state.tasks, id);
  state.selectedIds.delete(id);
  persistAndRender();
  showUndo(elements, `Задача «${taskToDelete.title}» удалена.`, restoreSnapshot);
}

function openEditDialog(task) {
  state.editingId = task.id;
  elements.editTitle.value = task.title;
  elements.editCategory.value = task.category;
  elements.editPriority.value = task.priority;
  elements.editDeadline.value = task.deadline;
  elements.editRepeat.value = task.repeat;
  elements.editDialog.showModal();
  elements.editTitle.focus();
}

function resetForm() {
  elements.form.reset();
  elements.prioritySelect.value = 'medium';
  elements.repeatSelect.value = 'none';
  elements.input.focus();
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = elements.input.value.trim();

  if (!title) {
    elements.input.focus();
    return;
  }

  snapshot();
  state.tasks = addTask(state.tasks, {
    title,
    category: elements.categorySelect.value,
    priority: elements.prioritySelect.value,
    deadline: elements.deadlineInput.value,
    repeat: elements.repeatSelect.value,
  });
  resetForm();
  persistAndRender();
});

elements.categoryForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const category = elements.newCategoryInput.value.trim();

  if (!category || state.categories.includes(category)) {
    elements.newCategoryInput.value = '';
    return;
  }

  state.categories = [...state.categories, category];
  saveCategories(state.categories);
  elements.newCategoryInput.value = '';
  render();
});

elements.searchInput.addEventListener('input', () => {
  state.query = elements.searchInput.value;
  render();
});

elements.accentInput.addEventListener('input', () => applyAccent(elements.accentInput.value));

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

elements.bulkCompleteButton.addEventListener('click', () => {
  snapshot();
  state.tasks = updateManyTasks(state.tasks, state.selectedIds, {
    completed: true,
    completedAt: new Date().toISOString(),
  });
  state.selectedIds.clear();
  persistAndRender();
  showUndo(elements, 'Выбранные задачи отмечены выполненными.', restoreSnapshot);
});

elements.bulkDeleteButton.addEventListener('click', () => {
  snapshot();
  const count = state.selectedIds.size;
  state.tasks = deleteManyTasks(state.tasks, state.selectedIds);
  state.selectedIds.clear();
  persistAndRender();
  showUndo(elements, `Удалено задач: ${count}.`, restoreSnapshot);
});

elements.clearDoneButton.addEventListener('click', () => {
  snapshot();
  state.tasks = clearCompletedTasks(state.tasks);
  state.selectedIds.clear();
  persistAndRender();
  showUndo(elements, 'Выполненные задачи удалены.', restoreSnapshot);
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
    snapshot();
    state.tasks = await readTasksFile(file, state.categories);
    state.selectedIds.clear();
    persistAndRender();
  } finally {
    elements.importInput.value = '';
  }
});

elements.editForm.addEventListener('submit', (event) => {
  event.preventDefault();

  snapshot();
  state.tasks = updateTask(state.tasks, state.editingId, {
    title: elements.editTitle.value,
    category: elements.editCategory.value,
    priority: elements.editPriority.value,
    deadline: elements.editDeadline.value,
    repeat: elements.editRepeat.value,
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
    elements.searchInput.value = '';
    state.query = '';
    render();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    restoreSnapshot();
  }
});

function updateOnlineStatus() {
  elements.offlineStatus.hidden = navigator.onLine;
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      elements.updateApp.hidden = false;
    });
  });
}

elements.updateApp.addEventListener('click', () => window.location.reload());

applyTheme(loadTheme());
applyAccent(loadAccent());
updateOnlineStatus();
render();
