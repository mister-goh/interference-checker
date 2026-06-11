/**
 * src/lib/saved-analyses.ts
 *
 * localStorage persistence for full analysis snapshots (SavedAnalysis).
 * Mirrors lib/favorites.ts and lib/presets.ts — versioned key, schema guard,
 * dedup-by-name, best-effort persistence. Korean error messages.
 *
 * Stores only the input state; results are recomputed on restore.
 */

import type { SavedAnalysis } from '../types';
import { SAVED_ANALYSIS_SCHEMA_VERSION } from '../types';

export const SAVED_ANALYSIS_STORAGE_KEY = 'isotope-saved-analyses-v1';
export const SAVED_ANALYSIS_MAX_COUNT = 50;

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadSavedAnalyses(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(SAVED_ANALYSIS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(isValidSavedAnalysis);
  } catch {
    return [];
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Add a snapshot (replacing any existing one with the same name).
 * Prepends newest-first, enforces SAVED_ANALYSIS_MAX_COUNT.
 * @returns Updated list, or a Korean error on failure.
 */
export function addSavedAnalysis(
  current: SavedAnalysis[],
  analysis: SavedAnalysis,
): { analyses: SavedAnalysis[]; error?: string } {
  if (!analysis.name.trim()) {
    return { analyses: current, error: '분석 이름을 입력해 주세요.' };
  }
  const deduped = current.filter((a) => a.name !== analysis.name);
  const updated = [analysis, ...deduped].slice(0, SAVED_ANALYSIS_MAX_COUNT);
  try {
    persist(updated);
    return { analyses: updated };
  } catch {
    return {
      analyses: current,
      error: '분석 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.',
    };
  }
}

export function removeSavedAnalysis(
  current: SavedAnalysis[],
  id: string,
): SavedAnalysis[] {
  const updated = current.filter((a) => a.id !== id);
  try {
    persist(updated);
  } catch {
    /* best-effort */
  }
  return updated;
}

export function renameSavedAnalysis(
  current: SavedAnalysis[],
  id: string,
  name: string,
): { analyses: SavedAnalysis[]; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { analyses: current, error: '분석 이름을 입력해 주세요.' };
  const updated = current.map((a) => (a.id === id ? { ...a, name: trimmed } : a));
  try {
    persist(updated);
    return { analyses: updated };
  } catch {
    return {
      analyses: current,
      error: '분석 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.',
    };
  }
}

// ── Internal ──────────────────────────────────────────────────────────────────

function persist(analyses: SavedAnalysis[]): void {
  localStorage.setItem(SAVED_ANALYSIS_STORAGE_KEY, JSON.stringify(analyses));
}

function isRecordOfNumbers(v: unknown): v is Record<string, number> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every(
    (n) => typeof n === 'number',
  );
}

function isValidSavedAnalysis(item: unknown): item is SavedAnalysis {
  if (typeof item !== 'object' || item === null) return false;
  const a = item as Record<string, unknown>;
  return (
    a.schemaVersion === SAVED_ANALYSIS_SCHEMA_VERSION &&
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    typeof a.savedAt === 'string' &&
    typeof a.formula === 'string' &&
    typeof a.compoundName === 'string' &&
    typeof a.matrix === 'object' && a.matrix !== null &&
    typeof a.caps === 'object' && a.caps !== null &&
    typeof a.congenerEnabled === 'boolean' &&
    isRecordOfNumbers(a.congenerOverrides) &&
    isRecordOfNumbers(a.customCongeners) &&
    (a.activePresetId === null || typeof a.activePresetId === 'string') &&
    Array.isArray(a.activeStatuses) &&
    Array.isArray(a.sorting)
  );
}
