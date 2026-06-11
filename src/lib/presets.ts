/**
 * src/lib/presets.ts
 *
 * Single source of truth for localStorage element-preset management (Phase 2).
 * Mirrors src/lib/favorites.ts — same versioned key, schema guard, and
 * best-effort persistence patterns.
 *
 * A preset is a compound-independent set of element symbols the analyst checks
 * repeatedly (e.g. a fixed list of guaranteed metals). Dedup is by name.
 *
 * Error messages are in Korean per PRD/04_PROJECT_SPEC.md ALWAYS-DO list.
 */

import type { ElementPreset } from '../types';
import { PRESETS_SCHEMA_VERSION } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

export const PRESET_STORAGE_KEY = 'isotope-searcher-presets-v1';

/** Maximum number of saved presets. Guards against localStorage quota errors. */
export const PRESET_MAX_COUNT = 30;

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Load all valid presets from localStorage.
 * Returns [] on any parse error or missing key — never throws.
 * Silently drops entries whose schema does not match the current version.
 */
export function loadPresets(): ElementPreset[] {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(isValidPreset);
  } catch {
    return [];
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Add a new preset (or replace an existing entry with the same name).
 * Prepends to the list so the most-recently saved appears first.
 * Enforces PRESET_MAX_COUNT — oldest entries are dropped if exceeded.
 *
 * @returns Updated list on success, or a Korean error message on failure.
 */
export function addPreset(
  current: ElementPreset[],
  name: string,
  symbols: string[],
): { presets: ElementPreset[]; error?: string } {
  const cleanSymbols = normalizeSymbols(symbols);
  if (cleanSymbols.length === 0) {
    return { presets: current, error: '원소를 1개 이상 선택해 주세요.' };
  }

  const trimmedName = name.trim() || cleanSymbols[0] || '프리셋';

  const newPreset: ElementPreset = {
    schemaVersion: PRESETS_SCHEMA_VERSION,
    id: `${Date.now()}-${trimmedName}`,
    name: trimmedName,
    symbols: cleanSymbols,
    savedAt: new Date().toISOString(),
  };

  // Replace existing entry with the same name (dedup by name)
  const deduped = current.filter((p) => p.name !== trimmedName);
  const updated = [newPreset, ...deduped].slice(0, PRESET_MAX_COUNT);

  try {
    persistPresets(updated);
    return { presets: updated };
  } catch {
    return {
      presets: current,
      error: '프리셋 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.',
    };
  }
}

/**
 * Update an existing preset by id (partial — name and/or symbols).
 * @returns Updated list on success, or a Korean error message on failure.
 */
export function updatePreset(
  current: ElementPreset[],
  id: string,
  changes: { name?: string; symbols?: string[] },
): { presets: ElementPreset[]; error?: string } {
  const target = current.find((p) => p.id === id);
  if (!target) return { presets: current };

  const nextName =
    changes.name !== undefined ? changes.name.trim() : target.name;
  const nextSymbols =
    changes.symbols !== undefined
      ? normalizeSymbols(changes.symbols)
      : target.symbols;

  if (nextSymbols.length === 0) {
    return { presets: current, error: '원소를 1개 이상 선택해 주세요.' };
  }

  const updated = current.map((p) =>
    p.id === id
      ? { ...p, name: nextName || p.name, symbols: nextSymbols }
      : p,
  );

  try {
    persistPresets(updated);
    return { presets: updated };
  } catch {
    return {
      presets: current,
      error: '프리셋 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.',
    };
  }
}

/**
 * Remove a preset by id.
 * @returns Updated list. Never throws.
 */
export function removePreset(
  current: ElementPreset[],
  id: string,
): ElementPreset[] {
  const updated = current.filter((p) => p.id !== id);
  try {
    persistPresets(updated);
  } catch {
    // Best-effort: in-memory state is still correct even if persist fails
  }
  return updated;
}

// ── Internal ──────────────────────────────────────────────────────────────────

/** Trim, drop empties, and de-duplicate symbols while preserving order. */
function normalizeSymbols(symbols: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of symbols) {
    const t = typeof s === 'string' ? s.trim() : '';
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

function persistPresets(presets: ElementPreset[]): void {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function isValidPreset(item: unknown): item is ElementPreset {
  if (typeof item !== 'object' || item === null) return false;
  const p = item as Record<string, unknown>;
  return (
    p.schemaVersion === PRESETS_SCHEMA_VERSION &&
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.savedAt === 'string' &&
    Array.isArray(p.symbols) &&
    (p.symbols as unknown[]).every((s) => typeof s === 'string')
  );
}
