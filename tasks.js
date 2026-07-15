export const FILTERS = Object.freeze({
  all: 'all',
  active: 'active',
  completed: 'completed',
});

export const SORTS = Object.freeze({
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

export const CATEGORIES = ['Личное', 'Работа', 'Учёба', 'Дом', 'Покупки'];

export function createTask({
  title,
  category = CATEGORIES[0],
  priority = 'medium',
  deadline = '',
  id = crypto.randomUUID(),
  createdAt = new Date().toISOString(),
}) {
  return {
    id,
    title: title.trim(),
    completed: false,
    category,
    priority,
    deadline,
    createdAt,
  };
}

export function addTask(tasks, taskInput) {
  return [createTask(taskInput), ...tasks];
}

export function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function toggleTask(tasks, id) {
  return tasks.map((task) => (
    task.id === id ? { ...task, completed: !task.completed } : task
  ));
}

export function updateTask(tasks, id, updates) {
  return tasks.map((task) => (
    task.id === id ? { ...task, ...updates, title: updates.title?.trim() ?? task.title } : task
  ));
}

export function clearCompletedTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getStats(tasks) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    active: total - completed,
    percent,
  };
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

    return new Date(secondTask.createdAt) - new Date(firstTask.createdAt);
  });
}

export function getVisibleTasks(tasks, filter, sort) {
  return sortTasks(filterTasks(tasks, filter), sort);
}

export function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .filter((task) => task && typeof task.title === 'string' && task.title.trim())
    .map((task) => ({
      id: task.id || crypto.randomUUID(),
      title: task.title.trim(),
      completed: Boolean(task.completed),
      category: CATEGORIES.includes(task.category) ? task.category : CATEGORIES[0],
      priority: PRIORITIES[task.priority] ? task.priority : 'medium',
      deadline: task.deadline || '',
      createdAt: task.createdAt || new Date().toISOString(),
    }));
}
