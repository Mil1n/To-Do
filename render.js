import { getDeadlineStatus, getProductivity, getStats, getVisibleTasks } from './tasks.js';

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const repeatLabels = {
  none: 'без повтора',
  daily: 'ежедневно',
  weekly: 'еженедельно',
  monthly: 'ежемесячно',
};

const statusLabels = {
  none: '',
  overdue: '🔥 просрочено',
  today: '⏰ сегодня',
  tomorrow: '🌅 завтра',
  upcoming: '📅 скоро',
};

function renderCategoryOptions(select, categories, selectedCategory) {
  select.replaceChildren();
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.textContent = category;
    option.selected = category === selectedCategory;
    select.append(option);
  });
}

export function renderCategories(elements, categories) {
  renderCategoryOptions(elements.categorySelect, categories, elements.categorySelect.value || categories[0]);
  renderCategoryOptions(elements.editCategory, categories, elements.editCategory.value || categories[0]);
}

export function renderApp(state, elements, handlers) {
  const visibleTasks = getVisibleTasks(state.tasks, state.filter, state.sort, state.query);
  const stats = getStats(state.tasks);
  const productivity = getProductivity(state.tasks);

  elements.list.replaceChildren();
  elements.emptyState.hidden = visibleTasks.length > 0;
  elements.emptyState.textContent = state.tasks.length === 0
    ? 'Пока задач нет. Добавьте первую задачу выше.'
    : 'По выбранным фильтрам задач нет.';

  visibleTasks.forEach((task) => {
    const item = elements.template.content.firstElementChild.cloneNode(true);
    const bulkCheckbox = item.querySelector('.bulk-checkbox');
    const checkbox = item.querySelector('.task-checkbox');
    const title = item.querySelector('.task-title');
    const category = item.querySelector('.task-category');
    const priority = item.querySelector('.task-priority');
    const deadline = item.querySelector('.task-deadline');
    const repeat = item.querySelector('.task-repeat');
    const status = item.querySelector('.task-status');
    const editButton = item.querySelector('.edit-button');
    const deleteButton = item.querySelector('.delete-button');
    const deadlineStatus = getDeadlineStatus(task);

    item.classList.toggle('completed', task.completed);
    item.classList.toggle('overdue', deadlineStatus === 'overdue');
    item.dataset.priority = task.priority;
    item.dataset.id = task.id;
    checkbox.checked = task.completed;
    bulkCheckbox.checked = state.selectedIds.has(task.id);
    title.textContent = task.title;
    category.textContent = task.category;
    priority.textContent = priorityLabels[task.priority];
    deadline.textContent = task.deadline ? `до ${task.deadline}` : 'без срока';
    repeat.textContent = repeatLabels[task.repeat];
    status.textContent = statusLabels[deadlineStatus];
    status.hidden = deadlineStatus === 'none';

    checkbox.addEventListener('change', () => handlers.onToggleTask(task.id));
    bulkCheckbox.addEventListener('change', () => handlers.onSelectTask(task.id));
    editButton.addEventListener('click', () => handlers.onEditTask(task));
    deleteButton.addEventListener('click', () => handlers.onDeleteTask(task.id));
    item.addEventListener('dragstart', (event) => handlers.onDragStart(event, task.id));
    item.addEventListener('dragover', handlers.onDragOver);
    item.addEventListener('drop', (event) => handlers.onDrop(event, task.id));

    elements.list.append(item);
  });

  elements.totalCount.textContent = `Всего: ${stats.total}`;
  elements.doneCount.textContent = `Выполнено: ${stats.completed}`;
  elements.activeCount.textContent = `Активно: ${stats.active}`;
  elements.todayCount.textContent = `Сегодня: ${stats.dueToday}`;
  elements.overdueCount.textContent = `Просрочено: ${stats.overdue}`;
  elements.progressBar.value = stats.percent;
  elements.progressText.textContent = `${stats.percent}%`;
  elements.clearDoneButton.disabled = stats.completed === 0;
  elements.bulkCompleteButton.disabled = state.selectedIds.size === 0;
  elements.bulkDeleteButton.disabled = state.selectedIds.size === 0;
  elements.completedToday.textContent = productivity.completedToday;
  elements.completedWeek.textContent = productivity.completedWeek;
  elements.bestCategory.textContent = productivity.bestCategory;

  elements.filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  elements.sortSelect.value = state.sort;
}

export function showUndo(elements, message, onUndo) {
  elements.undoText.textContent = message;
  elements.undoToast.hidden = false;
  elements.undoButton.onclick = onUndo;

  window.clearTimeout(elements.undoTimer);
  elements.undoTimer = window.setTimeout(() => {
    elements.undoToast.hidden = true;
  }, 5000);
}
