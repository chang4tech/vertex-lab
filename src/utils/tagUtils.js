import { COMMON_TAGS } from './nodeUtils';

const STORAGE_KEY = 'vertex_tags';

export const loadTags = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...COMMON_TAGS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [...COMMON_TAGS];
  } catch {
    return [...COMMON_TAGS];
  }
};

export const saveTags = (tags) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags || []));
  } catch {
    // ignore storage errors
  }
};

export const generateTagId = (name) => {
  const base = (name || 'tag').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tag';
  return `${base}-${Date.now()}`;
};

