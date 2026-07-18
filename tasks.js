export const FILTERS = Object.freeze({
  all: 'all',
  active: 'active',
  completed: 'completed',
});

export const SORTS = Object.freeze({
  manual: 'manual',
  newest: 'newest',
  oldest: 'oldest',
  priority: 'priority',
  deadline: 'deadline',
});

export const PRIORITIES = Object.freeze({
  low: 1,
  medium: 2,
  high: 3,
});

export const DEFAULT_CATEGORIES = ['Личное', 'Работа', 'Учёба', 'Дом', 'Покупки'];
export const REPEATS = ['none', 'daily', 'weekly', 'monthly'];

function uid() {
  return crypto.randomUUID();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function getNextDeadline(deadline, repeat) {
  const baseDate = deadline || today();

  if (repeat === 'daily') {
    return addDays(baseDate, 1);
  }

  if (repeat === 'weekly') {
    return addDays(baseDate, 7);
  }

  if (repeat === 'monthly') {
    return addMonths(baseDate, 1);
  }

  return deadline || '';
}

export function createTask({
  title,
  category = DEFAULT_CATEGORIES[0],
  priority = 'medium',
  deadline = '',
  repeat = 'none',
  id = uid(),
  createdAt = new Date().toISOString(),
  order = Date.now(),
}) {
  return {
    id,
    title: title.trim(),
    completed: false,
    category,
    priority,
    deadline,
    repeat,
    order,
    createdAt,
    completedAt: '',
  };
}

export function addTask(tasks, taskInput) {
  const minOrder = Math.min(0, ...tasks.map((task) => Number(task.order) || 0));
  return [createTask({ ...taskInput, order: minOrder - 1 }), ...tasks];
}

export function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function toggleTask(tasks, id) {
  const now = new Date().toISOString();
  const nextTasks = [];

  tasks.forEach((task) => {
    if (task.id !== id) {
      nextTasks.push(task);
      return;
    }

    const completed = !task.completed;
    nextTasks.push({
      ...task,
      completed,
      completedAt: completed ? now : '',
    });

    if (completed && task.repeat !== 'none') {
      nextTasks.unshift(createTask({
        title: task.title,
        category: task.category,
        priority: task.priority,
        deadline: getNextDeadline(task.deadline, task.repeat),
        repeat: task.repeat,
        order: (Number(task.order) || 0) - 0.5,
      }));
    }
  });

  return nextTasks;
}

export function updateTask(tasks, id, updates) {
  return tasks.map((task) => (
    task.id === id
      ? {
        ...task,
        ...updates,
        title: updates.title?.trim() ?? task.title,
        repeat: REPEATS.includes(updates.repeat) ? updates.repeat : task.repeat,
      }
      : task
  ));
}

export function updateManyTasks(tasks, ids, updates) {
  const selectedIds = new Set(ids);
  return tasks.map((task) => (selectedIds.has(task.id) ? { ...task, ...updates } : task));
}

export function deleteManyTasks(tasks, ids) {
  const selectedIds = new Set(ids);
  return tasks.filter((task) => !selectedIds.has(task.id));
}

export function clearCompletedTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function moveTask(tasks, sourceId, targetId) {
  const nextTasks = [...tasks].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const sourceIndex = nextTasks.findIndex((task) => task.id === sourceId);
  const targetIndex = nextTasks.findIndex((task) => task.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return tasks;
  }

  const [movedTask] = nextTasks.splice(sourceIndex, 1);
  nextTasks.splice(targetIndex, 0, movedTask);

  return nextTasks.map((task, index) => ({ ...task, order: index }));
}

export function getStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const overdue = tasks.filter((task) => getDeadlineStatus(task) === 'overdue').length;
  const dueToday = tasks.filter((task) => getDeadlineStatus(task) === 'today').length;

  return {
    total,
    completed,
    active: total - completed,
    percent,
    overdue,
    dueToday,
  };
}

export function getDeadlineStatus(task, now = today()) {
  if (!task.deadline || task.completed) {
    return 'none';
  }

  if (task.deadline < now) {
    return 'overdue';
  }

  if (task.deadline === now) {
    return 'today';
  }

  if (task.deadline === addDays(now, 1)) {
    return 'tomorrow';
  }

  return 'upcoming';
}

export function filterTasks(tasks, filter) {
  if (filter === FILTERS.active) {
    return tasks.filter((task) => !task.completed);
  }

  if (filter === FILTERS.completed) {
    return tasks.filter((task) => task.completed);
  }

  return [...tasks];
}

export function searchTasks(tasks, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...tasks];
  }

  return tasks.filter((task) => [task.title, task.category, task.priority, task.deadline]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery));
}

export function sortTasks(tasks, sort) {
  return [...tasks].sort((firstTask, secondTask) => {
    if (sort === SORTS.oldest) {
      return new Date(firstTask.createdAt) - new Date(secondTask.createdAt);
    }

    if (sort === SORTS.priority) {
      return (PRIORITIES[secondTask.priority] ?? 0) - (PRIORITIES[firstTask.priority] ?? 0);
    }

    if (sort === SORTS.deadline) {
      const firstDeadline = firstTask.deadline || '9999-12-31';
      const secondDeadline = secondTask.deadline || '9999-12-31';
      return firstDeadline.localeCompare(secondDeadline);
    }

    if (sort === SORTS.newest) {
      return new Date(secondTask.createdAt) - new Date(firstTask.createdAt);
    }

    return (Number(firstTask.order) || 0) - (Number(secondTask.order) || 0);
  });
}

export function getVisibleTasks(tasks, filter, sort, query = '') {
  return sortTasks(searchTasks(filterTasks(tasks, filter), query), sort);
}

export function getProductivity(tasks, now = today()) {
  const completedTasks = tasks.filter((task) => task.completedAt);
  const completedToday = completedTasks.filter((task) => task.completedAt.slice(0, 10) === now).length;
  const completedWeek = completedTasks.filter((task) => {
    const completedDate = new Date(task.completedAt);
    const startDate = new Date(`${now}T00:00:00.000Z`);
    startDate.setUTCDate(startDate.getUTCDate() - 6);
    return completedDate >= startDate;
  }).length;

  const byCategory = completedTasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  return {
    completedToday,
    completedWeek,
    bestCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
  };
}

export function normalizeTasks(tasks, categories = DEFAULT_CATEGORIES) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .filter((task) => task && typeof task.title === 'string' && task.title.trim())
    .map((task, index) => ({
      id: task.id || uid(),
      title: task.title.trim(),
      completed: Boolean(task.completed),
      category: categories.includes(task.category) ? task.category : categories[0],
      priority: PRIORITIES[task.priority] ? task.priority : 'medium',
      deadline: task.deadline || '',
      repeat: REPEATS.includes(task.repeat) ? task.repeat : 'none',
      order: Number.isFinite(Number(task.order)) ? Number(task.order) : index,
      createdAt: task.createdAt || new Date().toISOString(),
      completedAt: task.completedAt || '',
    }));
}
