import { DEFAULT_CATEGORIES, normalizeTasks } from './tasks.js';

export const STORAGE_KEY = 'todo.tasks.v3';
export const LEGACY_STORAGE_KEY = 'todo.tasks.v2';
export const THEME_KEY = 'todo.theme.v1';
export const CATEGORIES_KEY = 'todo.categories.v1';
export const ACCENT_KEY = 'todo.accent.v1';

export function loadCategories() {
  const savedCategories = localStorage.getItem(CATEGORIES_KEY);

  if (!savedCategories) {
    return [...DEFAULT_CATEGORIES];
  }

  try {
    const categories = JSON.parse(savedCategories);
    return Array.isArray(categories) && categories.length > 0
      ? [...new Set(categories.filter((category) => typeof category === 'string' && category.trim()).map((category) => category.trim()))]
      : [...DEFAULT_CATEGORIES];
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function loadTasks(categories = loadCategories()) {
  const savedTasks = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!savedTasks) {
    return [];
  }

  try {
    return normalizeTasks(JSON.parse(savedTasks), categories);
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

export function loadAccent() {
  return localStorage.getItem(ACCENT_KEY) || '#4f46e5';
}

export function saveAccent(color) {
  localStorage.setItem(ACCENT_KEY, color);
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

export function readTasksFile(file, categories) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      try {
        resolve(normalizeTasks(JSON.parse(reader.result), categories));
      } catch (error) {
        reject(error);
      }
    });

    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(file);
  });
}
