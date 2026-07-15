import { getStats, getVisibleTasks } from './tasks.js';

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

export function renderApp(state, elements, handlers) {
  const visibleTasks = getVisibleTasks(state.tasks, state.filter, state.sort);
  const stats = getStats(state.tasks);

  elements.list.replaceChildren();
  elements.emptyState.hidden = visibleTasks.length > 0;
  elements.emptyState.textContent = state.tasks.length === 0
    ? 'Пока задач нет. Добавьте первую задачу выше.'
    : 'По выбранному фильтру задач нет.';

  visibleTasks.forEach((task) => {
    const item = elements.template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector('.task-checkbox');
    const title = item.querySelector('.task-title');
    const category = item.querySelector('.task-category');
    const priority = item.querySelector('.task-priority');
    const deadline = item.querySelector('.task-deadline');
    const editButton = item.querySelector('.edit-button');
    const deleteButton = item.querySelector('.delete-button');

    item.classList.toggle('completed', task.completed);
    item.classList.toggle('overdue', Boolean(task.deadline) && !task.completed && task.deadline < new Date().toISOString().slice(0, 10));
    item.dataset.priority = task.priority;
    checkbox.checked = task.completed;
    title.textContent = task.title;
    category.textContent = task.category;
    priority.textContent = priorityLabels[task.priority];
    deadline.textContent = task.deadline ? `до ${task.deadline}` : 'без срока';

    checkbox.addEventListener('change', () => handlers.onToggleTask(task.id));
    editButton.addEventListener('click', () => handlers.onEditTask(task));
    deleteButton.addEventListener('click', () => handlers.onDeleteTask(task.id));

    elements.list.append(item);
  });

  elements.totalCount.textContent = `Всего: ${stats.total}`;
  elements.doneCount.textContent = `Выполнено: ${stats.completed}`;
  elements.activeCount.textContent = `Активно: ${stats.active}`;
  elements.progressBar.value = stats.percent;
  elements.progressText.textContent = `${stats.percent}%`;
  elements.clearDoneButton.disabled = stats.completed === 0;

  elements.filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  elements.sortSelect.value = state.sort;
}

export function showUndo(elements, task, onUndo) {
  elements.undoText.textContent = `Задача «${task.title}» удалена.`;
  elements.undoToast.hidden = false;
  elements.undoButton.onclick = onUndo;

  window.clearTimeout(elements.undoTimer);
  elements.undoTimer = window.setTimeout(() => {
    elements.undoToast.hidden = true;
  }, 5000);
}
