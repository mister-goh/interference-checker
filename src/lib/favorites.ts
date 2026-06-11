/**
 * src/lib/favorites.ts
 *
 * Single source of truth for localStorage favorites management.
 * Extracted from App.tsx provisional implementation.
 *
 * Storage key is versioned: bump FAV_STORAGE_KEY when the schema changes
 * (old key is simply abandoned — no migration needed for Phase 1).
 *
 * Error messages are in Korean per PRD/04_PROJECT_SPEC.md ALWAYS-DO list.
 */

import type { FavoriteCompound } from '../types';
import { FAVOURITES_SCHEMA_VERSION } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

export const FAV_STORAGE_KEY = 'isotope-searcher-favorites-v1';

/** Maximum number of saved favorites. Guards against localStorage quota errors. */
export const FAV_MAX_COUNT = 50;

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Load all valid favorites from localStorage.
 * Returns [] on any parse error or missing key — never throws.
 * Silently drops entries whose schemaVersion does not match the current version.
 */
export function loadFavorites(): FavoriteCompound[] {
  try {
    const raw = localStorage.getItem(FAV_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(isValidFavorite);
  } catch {
    // JSON.parse failure or localStorage unavailable (e.g. private-browsing quota)
    return [];
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Add a new favorite (or replace existing entry with same formula).
 * Prepends to the list so the most-recently saved appears first.
 * Enforces FAV_MAX_COUNT limit — oldest entries are dropped if exceeded.
 *
 * @returns Updated list on success, or an error message string (Korean) on failure.
 */
export function addFavorite(
  current: FavoriteCompound[],
  name: string,
  formula: string,
): { favorites: FavoriteCompound[]; error?: string } {
  const trimmedFormula = formula.trim();
  const trimmedName = name.trim() || trimmedFormula;

  if (!trimmedFormula) {
    return { favorites: current, error: '저장할 화학식이 없습니다.' };
  }

  const id = `${Date.now()}-${trimmedFormula}`;
  const newFav: FavoriteCompound = {
    schemaVersion: FAVOURITES_SCHEMA_VERSION,
    id,
    name: trimmedName,
    formula: trimmedFormula,
    savedAt: new Date().toISOString(),
  };

  // Replace existing entry with the same formula (dedup by formula)
  const deduped = current.filter((f) => f.formula !== trimmedFormula);
  const updated = [newFav, ...deduped].slice(0, FAV_MAX_COUNT);

  try {
    persistFavorites(updated);
    return { favorites: updated };
  } catch {
    return {
      favorites: current,
      error: '즐겨찾기 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.',
    };
  }
}

/**
 * Remove a favorite by id.
 * @returns Updated list. Never throws.
 */
export function removeFavorite(
  current: FavoriteCompound[],
  id: string,
): FavoriteCompound[] {
  const updated = current.filter((f) => f.id !== id);
  try {
    persistFavorites(updated);
  } catch {
    // Best-effort: in-memory state is still correct even if persist fails
  }
  return updated;
}

// ── Internal ──────────────────────────────────────────────────────────────────

function persistFavorites(favs: FavoriteCompound[]): void {
  localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
}

function isValidFavorite(item: unknown): item is FavoriteCompound {
  if (typeof item !== 'object' || item === null) return false;
  const f = item as Record<string, unknown>;
  return (
    f.schemaVersion === FAVOURITES_SCHEMA_VERSION &&
    typeof f.id === 'string' &&
    typeof f.name === 'string' &&
    typeof f.formula === 'string' &&
    typeof f.savedAt === 'string'
  );
}
