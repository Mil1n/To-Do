import { normalizeTasks } from './tasks.js';

export const STORAGE_KEY = 'todo.tasks.v2';
export const THEME_KEY = 'todo.theme.v1';

export function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    return normalizeTasks(JSON.parse(savedTasks));
  } catch {
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function downloadTasks(tasks) {
  const file = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = url;
  link.download = `todo-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function readTasksFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      try {
        resolve(normalizeTasks(JSON.parse(reader.result)));
      } catch (error) {
        reject(error);
      }
    });

    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(file);
  });
}
