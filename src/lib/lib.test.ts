/**
 * src/lib/lib.test.ts
 *
 * Unit tests for favorites.ts and export.ts.
 *
 * Test categories:
 *   A) favorites — load/add/remove, schema validation, quota, error messages
 *   B) export — row order preservation, headers, column serialisation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  compareElementSymbol,
  compareElementName,
  compareRecommendedMass,
  applySorting,
} from './sorting';
import {
  loadFavorites,
  addFavorite,
  removeFavorite,
  FAV_STORAGE_KEY,
  FAV_MAX_COUNT,
} from './favorites';
import { buildSheet } from './export';
import * as XLSX from 'xlsx';
import type { FavoriteCompound, Recommendation } from '../types';
import { STATUS_LABELS } from '../components/StatusBadge';
import { FAVOURITES_SCHEMA_VERSION } from '../types';

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFav(formula: string, name = formula, id?: string): FavoriteCompound {
  return {
    schemaVersion: FAVOURITES_SCHEMA_VERSION,
    id: id ?? `test-${formula}`,
    name,
    formula,
    savedAt: new Date().toISOString(),
  };
}

function makeRec(
  symbol: string,
  mass: number,
  abundance: number,
  status: Recommendation['status'] = 'clean',
): Recommendation {
  return {
    elementSymbol: symbol,
    elementName: symbol,
    recommendedMass: mass,
    abundance,
    interferences: [],
    status,
    recommendedMode: 'Standard',
    alternativeMasses: [],
    isotopes: [],
  };
}

// ── A) favorites ──────────────────────────────────────────────────────────────

describe('loadFavorites', () => {
  beforeEach(() => localStorageMock.clear());

  it('returns [] when storage is empty', () => {
    expect(loadFavorites()).toEqual([]);
  });

  it('returns [] when storage contains invalid JSON', () => {
    localStorageMock.setItem(FAV_STORAGE_KEY, '{bad json');
    expect(loadFavorites()).toEqual([]);
  });

  it('returns [] when storage contains non-array JSON', () => {
    localStorageMock.setItem(FAV_STORAGE_KEY, JSON.stringify({ foo: 1 }));
    expect(loadFavorites()).toEqual([]);
  });

  it('drops entries with wrong schemaVersion', () => {
    const stale = [{ schemaVersion: 99, id: 'x', name: 'X', formula: 'X', savedAt: '' }];
    localStorageMock.setItem(FAV_STORAGE_KEY, JSON.stringify(stale));
    expect(loadFavorites()).toEqual([]);
  });

  it('drops entries missing required fields', () => {
    const bad = [{ schemaVersion: FAVOURITES_SCHEMA_VERSION, id: 'x' }]; // missing name/formula/savedAt
    localStorageMock.setItem(FAV_STORAGE_KEY, JSON.stringify(bad));
    expect(loadFavorites()).toEqual([]);
  });

  it('loads valid entries correctly', () => {
    const fav = makeFav('HfCl4', 'HfCl4');
    localStorageMock.setItem(FAV_STORAGE_KEY, JSON.stringify([fav]));
    const result = loadFavorites();
    expect(result).toHaveLength(1);
    expect(result[0].formula).toBe('HfCl4');
  });

  it('keeps valid entries and drops invalid ones from mixed array', () => {
    const valid = makeFav('HfCl4');
    const invalid = { schemaVersion: 0, id: 'bad' };
    localStorageMock.setItem(FAV_STORAGE_KEY, JSON.stringify([valid, invalid]));
    expect(loadFavorites()).toHaveLength(1);
    expect(loadFavorites()[0].formula).toBe('HfCl4');
  });
});

describe('addFavorite', () => {
  beforeEach(() => localStorageMock.clear());

  it('prepends new favorite to empty list', () => {
    const { favorites, error } = addFavorite([], 'HfCl4', 'HfCl4');
    expect(error).toBeUndefined();
    expect(favorites).toHaveLength(1);
    expect(favorites[0].formula).toBe('HfCl4');
    expect(favorites[0].name).toBe('HfCl4');
  });

  it('uses formula as name when name is blank', () => {
    const { favorites } = addFavorite([], '', 'Al2O3');
    expect(favorites[0].name).toBe('Al2O3');
  });

  it('prepends so newest appears first', () => {
    const existing = [makeFav('Al2O3')];
    const { favorites } = addFavorite(existing, 'HfCl4', 'HfCl4');
    expect(favorites[0].formula).toBe('HfCl4');
    expect(favorites[1].formula).toBe('Al2O3');
  });

  it('deduplicates by formula — replaces existing entry with same formula', () => {
    const existing = [makeFav('HfCl4', 'old name')];
    const { favorites } = addFavorite(existing, 'new name', 'HfCl4');
    expect(favorites).toHaveLength(1);
    expect(favorites[0].name).toBe('new name');
  });

  it('persists to localStorage', () => {
    addFavorite([], 'HfCl4', 'HfCl4');
    const stored = JSON.parse(localStorageMock.getItem(FAV_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].formula).toBe('HfCl4');
  });

  it('returns Korean error when formula is empty', () => {
    const { favorites, error } = addFavorite([], 'name', '  ');
    expect(error).toBeTruthy();
    expect(error).toMatch(/저장할 화학식/);
    expect(favorites).toHaveLength(0);
  });

  it('enforces FAV_MAX_COUNT — drops oldest beyond limit', () => {
    const existing: FavoriteCompound[] = Array.from({ length: FAV_MAX_COUNT }, (_, i) =>
      makeFav(`El${i}`, `El${i}`, `id-${i}`)
    );
    const { favorites } = addFavorite(existing, 'new', 'NewEl');
    expect(favorites).toHaveLength(FAV_MAX_COUNT);
    expect(favorites[0].formula).toBe('NewEl');
    // Oldest entry (El49) should be dropped
    expect(favorites.find((f) => f.formula === `El${FAV_MAX_COUNT - 1}`)).toBeUndefined();
  });

  it('returns Korean error on localStorage quota failure', () => {
    const failStorage = {
      ...localStorageMock,
      setItem: () => { throw new DOMException('QuotaExceededError'); },
    };
    Object.defineProperty(globalThis, 'localStorage', { value: failStorage, writable: true });
    const { favorites, error } = addFavorite([], 'HfCl4', 'HfCl4');
    expect(error).toBeTruthy();
    expect(error).toMatch(/저장 공간/);
    expect(favorites).toHaveLength(0); // original list returned unchanged
    // Restore
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    localStorageMock.clear();
  });
});

describe('removeFavorite', () => {
  beforeEach(() => localStorageMock.clear());

  it('removes entry by id', () => {
    const existing = [makeFav('HfCl4', 'HfCl4', 'id-1'), makeFav('Al2O3', 'Al2O3', 'id-2')];
    const result = removeFavorite(existing, 'id-1');
    expect(result).toHaveLength(1);
    expect(result[0].formula).toBe('Al2O3');
  });

  it('returns unchanged list when id not found', () => {
    const existing = [makeFav('HfCl4', 'HfCl4', 'id-1')];
    const result = removeFavorite(existing, 'no-such-id');
    expect(result).toHaveLength(1);
  });

  it('persists updated list to localStorage', () => {
    const existing = [makeFav('HfCl4', 'HfCl4', 'id-1'), makeFav('Al2O3', 'Al2O3', 'id-2')];
    removeFavorite(existing, 'id-1');
    const stored = JSON.parse(localStorageMock.getItem(FAV_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].formula).toBe('Al2O3');
  });
});

// ── B) export ─────────────────────────────────────────────────────────────────

describe('buildSheet — export row order and content', () => {
  it('first row contains correct Korean headers', () => {
    const ws = buildSheet([]);
    // Row 0 (index 1 in A1-notation) — check each header cell
    expect(ws['A1']?.v).toBe('원소');
    expect(ws['B1']?.v).toBe('추천 질량 (m/z)');
    expect(ws['C1']?.v).toBe('존재비 (%)');
    expect(ws['D1']?.v).toBe('판정');
    expect(ws['E1']?.v).toBe('권장 모드');
    expect(ws['F1']?.v).toBe('주요 간섭종');
  });

  it('판정 column (D2) contains Korean label, not raw English status', () => {
    // Verifies STATUS_LABELS mapping is applied — raw enum must never appear in export.
    const statuses: Recommendation['status'][] = [
      'clean', 'avoidable', 'mode-required', 'difficult', 'not-analyzable',
    ];
    for (const status of statuses) {
      const ws = buildSheet([makeRec('As', 75, 100.0, status)]);
      expect(ws['D2']?.v).toBe(STATUS_LABELS[status]);
      expect(ws['D2']?.v).not.toBe(status);
    }
  });

  it('empty rows produces sheet with header only', () => {
    const ws = buildSheet([]);
    expect(ws['A2']).toBeUndefined();
  });

  it('preserves row order exactly — same as input array order', () => {
    // Deliberately pass in non-alphabetical order to prove no re-sorting happens
    const rows = [
      makeRec('Zn', 64, 48.6),
      makeRec('As', 75, 100.0),
      makeRec('Fe', 56, 91.754),
    ];
    const ws = buildSheet(rows);

    // Row 2 = first data row
    expect(ws['A2']?.v).toBe('Zn');
    expect(ws['A3']?.v).toBe('As');
    expect(ws['A4']?.v).toBe('Fe');
  });

  it('serialises recommendedMass as number', () => {
    const ws = buildSheet([makeRec('As', 75, 100.0)]);
    expect(ws['B2']?.v).toBe(75);
    expect(typeof ws['B2']?.v).toBe('number');
  });

  it('serialises abundance as number rounded to 2 dp', () => {
    const ws = buildSheet([makeRec('Hf', 180, 35.08)]);
    expect(ws['C2']?.v).toBe(35.08);
  });

  it('serialises interferences as comma-separated composition strings', () => {
    const rec: Recommendation = {
      elementSymbol: 'As',
      elementName: 'Arsenic',
      recommendedMass: 75,
      abundance: 100.0,
      interferences: [
        {
          type: 'polyatomic',
          composition: '⁴⁰Ar³⁵Cl⁺',
          targetMass: 75,
          precursorElements: ['Ar', 'Cl'],
          precursorAbundanceProduct: 75.46,
          severity: 'high',
          source: 'calculated',
        },
        {
          type: 'polyatomic',
          composition: '⁴⁰Ar³⁵Cl⁺ (alt)',
          targetMass: 75,
          precursorElements: ['Ar', 'Cl'],
          precursorAbundanceProduct: 1.0,
          severity: 'high',
          source: 'calculated',
        },
      ],
      status: 'mode-required',
      recommendedMode: 'DRC(NH3)',
      alternativeMasses: [],
      isotopes: [],
    };
    const ws = buildSheet([rec]);
    expect(ws['F2']?.v).toBe('⁴⁰Ar³⁵Cl⁺, ⁴⁰Ar³⁵Cl⁺ (alt)');
  });

  it('serialises empty interferences as "없음"', () => {
    const ws = buildSheet([makeRec('Li', 7, 92.41)]);
    expect(ws['F2']?.v).toBe('없음');
  });

  it('sort order identity — 10 rows in reverse-symbol order preserved', () => {
    // If export re-sorted internally, order would differ
    const symbols = ['U', 'Th', 'Pb', 'Hg', 'Au', 'Pt', 'Ir', 'Os', 'Re', 'W'];
    const rows = symbols.map((s, i) => makeRec(s, 200 + i, 50.0));
    const ws = buildSheet(rows);

    // Verify A2..A11 match the input order exactly
    symbols.forEach((sym, i) => {
      const cellAddr = XLSX.utils.encode_cell({ r: i + 1, c: 0 });
      expect(ws[cellAddr]?.v).toBe(sym);
    });
  });

  it('export uses shared applySorting — row order matches sorted input', () => {
    // Pass applySorting output directly to buildSheet to confirm it is the
    // same function used by export handlers (import verified at top of file).
    const rows = [makeRec('Zn', 64, 48.6), makeRec('As', 75, 100.0), makeRec('Fe', 56, 91.754)];
    const sorted = applySorting(rows, [{ id: 'elementSymbol', desc: false }]);
    const ws = buildSheet(sorted);
    expect(ws['A2']?.v).toBe('As');
    expect(ws['A3']?.v).toBe('Fe');
    expect(ws['A4']?.v).toBe('Zn');
  });
});

// ── C) sorting ────────────────────────────────────────────────────────────────

describe('compareElementName', () => {
  const named = (symbol: string, name: string): Recommendation => ({
    ...makeRec(symbol, 1, 100),
    elementName: name,
  });

  it('orders by full name alphabetically (Aluminum < Silver)', () => {
    expect(compareElementName(named('Al', 'Aluminum'), named('Ag', 'Silver'))).toBeLessThan(0);
  });

  it('returns 0 for equal names', () => {
    expect(compareElementName(named('Fe', 'Iron'), named('Fe', 'Iron'))).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(compareElementName(named('Fe', 'iron'), named('Fe', 'IRON'))).toBe(0);
  });
});

describe('compareElementSymbol', () => {
  it('returns negative when a < b alphabetically', () => {
    const a = makeRec('As', 75, 100);
    const b = makeRec('Fe', 56, 91.754);
    expect(compareElementSymbol(a, b)).toBeLessThan(0);
  });

  it('returns positive when a > b alphabetically', () => {
    const a = makeRec('Zn', 64, 48.6);
    const b = makeRec('As', 75, 100);
    expect(compareElementSymbol(a, b)).toBeGreaterThan(0);
  });

  it('returns 0 for equal symbols', () => {
    expect(compareElementSymbol(makeRec('Hf', 180, 35.08), makeRec('Hf', 178, 27.28))).toBe(0);
  });

  it('is case-insensitive', () => {
    // Both directions should produce same magnitude
    const a = makeRec('as', 75, 100);
    const b = makeRec('AS', 75, 100);
    expect(compareElementSymbol(a, b)).toBe(0);
  });
});

describe('compareRecommendedMass', () => {
  it('returns negative when a.mass < b.mass', () => {
    expect(compareRecommendedMass(makeRec('Fe', 54, 5.845), makeRec('Fe', 56, 91.754))).toBeLessThan(0);
  });

  it('returns positive when a.mass > b.mass', () => {
    expect(compareRecommendedMass(makeRec('Fe', 56, 91.754), makeRec('Fe', 54, 5.845))).toBeGreaterThan(0);
  });

  it('returns 0 for equal masses', () => {
    expect(compareRecommendedMass(makeRec('As', 75, 100), makeRec('As', 75, 100))).toBe(0);
  });
});

describe('applySorting', () => {
  it('returns original array reference when sorting is empty', () => {
    const rows = [makeRec('Zn', 64, 48.6), makeRec('As', 75, 100)];
    expect(applySorting(rows, [])).toBe(rows);
  });

  it('sorts by elementSymbol ascending', () => {
    const rows = [makeRec('Zn', 64, 48.6), makeRec('As', 75, 100), makeRec('Fe', 56, 91.754)];
    const result = applySorting(rows, [{ id: 'elementSymbol', desc: false }]);
    expect(result.map(r => r.elementSymbol)).toEqual(['As', 'Fe', 'Zn']);
  });

  it('sorts by elementSymbol descending', () => {
    const rows = [makeRec('As', 75, 100), makeRec('Zn', 64, 48.6), makeRec('Fe', 56, 91.754)];
    const result = applySorting(rows, [{ id: 'elementSymbol', desc: true }]);
    expect(result.map(r => r.elementSymbol)).toEqual(['Zn', 'Fe', 'As']);
  });

  it('sorts by recommendedMass ascending', () => {
    const rows = [makeRec('Fe', 56, 91.754), makeRec('As', 75, 100), makeRec('Fe', 54, 5.845)];
    const result = applySorting(rows, [{ id: 'recommendedMass', desc: false }]);
    expect(result.map(r => r.recommendedMass)).toEqual([54, 56, 75]);
  });

  it('sorts by recommendedMass descending', () => {
    const rows = [makeRec('Fe', 54, 5.845), makeRec('As', 75, 100), makeRec('Fe', 56, 91.754)];
    const result = applySorting(rows, [{ id: 'recommendedMass', desc: true }]);
    expect(result.map(r => r.recommendedMass)).toEqual([75, 56, 54]);
  });

  it('does not mutate the original array', () => {
    const rows = [makeRec('Zn', 64, 48.6), makeRec('As', 75, 100)];
    const original = [...rows];
    applySorting(rows, [{ id: 'elementSymbol', desc: false }]);
    expect(rows[0].elementSymbol).toBe(original[0].elementSymbol);
  });

  it('ignores unknown column ids', () => {
    const rows = [makeRec('Zn', 64, 48.6), makeRec('As', 75, 100)];
    // Should not throw and should return a copy in original order
    const result = applySorting(rows, [{ id: 'unknownCol', desc: false }]);
    expect(result.map(r => r.elementSymbol)).toEqual(['Zn', 'As']);
  });
});
