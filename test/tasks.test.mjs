import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FILTERS,
  SORTS,
  addTask,
  clearCompletedTasks,
  deleteTask,
  getDeadlineStatus,
  getNextDeadline,
  getProductivity,
  getStats,
  getVisibleTasks,
  moveTask,
  normalizeTasks,
  searchTasks,
  toggleTask,
  updateTask,
} from '../tasks.js';

const baseTasks = [
  {
    id: '1',
    title: 'Старая задача',
    completed: false,
    category: 'Работа',
    priority: 'low',
    deadline: '2026-07-20',
    repeat: 'none',
    order: 1,
    createdAt: '2026-07-10T00:00:00.000Z',
    completedAt: '',
  },
  {
    id: '2',
    title: 'Важная задача',
    completed: true,
    category: 'Дом',
    priority: 'high',
    deadline: '2026-07-16',
    repeat: 'weekly',
    order: 2,
    createdAt: '2026-07-12T00:00:00.000Z',
    completedAt: '2026-07-18T12:00:00.000Z',
  },
];

test('adds a task to the beginning of the list', () => {
  const result = addTask(baseTasks, { title: 'Новая задача', category: 'Учёба' });

  assert.equal(result[0].title, 'Новая задача');
  assert.equal(result[0].category, 'Учёба');
  assert.equal(result.length, 3);
});

test('toggles, updates, deletes and clears tasks', () => {
  const toggled = toggleTask(baseTasks, '1');
  assert.equal(toggled.find((task) => task.id === '1').completed, true);

  const updated = updateTask(toggled, '1', { title: 'Обновлённая задача', priority: 'high' });
  assert.equal(updated.find((task) => task.id === '1').title, 'Обновлённая задача');
  assert.equal(updated.find((task) => task.id === '1').priority, 'high');

  const deleted = deleteTask(updated, '2');
  assert.equal(deleted.some((task) => task.id === '2'), false);

  const cleared = clearCompletedTasks(toggled);
  assert.equal(cleared.every((task) => !task.completed), true);
});

test('calculates stats and visible tasks', () => {
  assert.deepEqual(getStats(baseTasks), {
    total: 2,
    completed: 1,
    active: 1,
    percent: 50,
    overdue: 0,
    dueToday: 0,
  });

  const activeTasks = getVisibleTasks(baseTasks, FILTERS.active, SORTS.newest);
  assert.deepEqual(activeTasks.map((task) => task.id), ['1']);

  const priorityTasks = getVisibleTasks(baseTasks, FILTERS.all, SORTS.priority);
  assert.deepEqual(priorityTasks.map((task) => task.id), ['2', '1']);
});

test('searches and manually reorders tasks', () => {
  assert.deepEqual(searchTasks(baseTasks, 'дом').map((task) => task.id), ['2']);
  assert.deepEqual(moveTask(baseTasks, '2', '1').map((task) => task.id), ['2', '1']);
});

test('handles recurring deadlines and deadline statuses', () => {
  assert.equal(getNextDeadline('2026-07-18', 'daily'), '2026-07-19');
  assert.equal(getNextDeadline('2026-07-18', 'weekly'), '2026-07-25');
  assert.equal(getDeadlineStatus({ deadline: '2026-07-17', completed: false }, '2026-07-18'), 'overdue');
  assert.equal(getDeadlineStatus({ deadline: '2026-07-19', completed: false }, '2026-07-18'), 'tomorrow');
});

test('normalizes imported tasks and calculates productivity', () => {
  const normalized = normalizeTasks([{ title: '  Импорт  ', category: 'X', priority: 'bad', repeat: 'daily' }], ['Личное']);
  assert.equal(normalized[0].title, 'Импорт');
  assert.equal(normalized[0].category, 'Личное');
  assert.equal(normalized[0].priority, 'medium');
  assert.equal(normalized[0].repeat, 'daily');

  assert.deepEqual(getProductivity(baseTasks, '2026-07-18'), {
    completedToday: 1,
    completedWeek: 1,
    bestCategory: 'Дом',
  });
});
