import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FILTERS,
  SORTS,
  addTask,
  clearCompletedTasks,
  deleteTask,
  getStats,
  getVisibleTasks,
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
    createdAt: '2026-07-10T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Важная задача',
    completed: true,
    category: 'Дом',
    priority: 'high',
    deadline: '2026-07-16',
    createdAt: '2026-07-12T00:00:00.000Z',
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
  assert.equal(toggled[0].completed, true);

  const updated = updateTask(toggled, '1', { title: 'Обновлённая задача', priority: 'high' });
  assert.equal(updated[0].title, 'Обновлённая задача');
  assert.equal(updated[0].priority, 'high');

  const deleted = deleteTask(updated, '2');
  assert.deepEqual(deleted.map((task) => task.id), ['1']);

  const cleared = clearCompletedTasks(toggled);
  assert.equal(cleared.length, 0);
});

test('calculates stats and visible tasks', () => {
  assert.deepEqual(getStats(baseTasks), {
    total: 2,
    completed: 1,
    active: 1,
    percent: 50,
  });

  const activeTasks = getVisibleTasks(baseTasks, FILTERS.active, SORTS.newest);
  assert.deepEqual(activeTasks.map((task) => task.id), ['1']);

  const priorityTasks = getVisibleTasks(baseTasks, FILTERS.all, SORTS.priority);
  assert.deepEqual(priorityTasks.map((task) => task.id), ['2', '1']);
});
