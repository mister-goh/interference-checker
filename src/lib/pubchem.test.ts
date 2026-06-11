/**
 * src/lib/pubchem.test.ts
 *
 * Unit tests for the PubChem layer. `fetch` is mocked — NO real network calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchAutocomplete,
  fetchCidsByName,
  fetchPropsByCids,
  resolveByName,
  resolveByCas,
  structureImageUrl,
  isAbortError,
  PubChemError,
} from './pubchem';

function jsonResponse(data: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

/** Route a mocked fetch by URL substring. */
function routeFetch(routes: { match: string; data: unknown; status?: number }[]) {
  return vi.fn(async (url: string) => {
    const r = routes.find((x) => url.includes(x.match));
    if (!r) return jsonResponse({}, 404);
    return jsonResponse(r.data, r.status ?? 200);
  });
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchAutocomplete', () => {
  it('returns compound names and caches the result', async () => {
    const f = routeFetch([
      { match: '/autocomplete/', data: { dictionary_terms: { compound: ['glucose', 'glucagon'] } } },
    ]);
    vi.stubGlobal('fetch', f);
    expect(await searchAutocomplete('gluco-unique-a')).toEqual(['glucose', 'glucagon']);
    // Second identical call should hit the cache (no extra fetch).
    await searchAutocomplete('gluco-unique-a');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('returns [] on HTTP error', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '/autocomplete/', data: {}, status: 500 }]));
    expect(await searchAutocomplete('whatever-unique-b')).toEqual([]);
  });

  it('re-throws AbortError', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw abort; }));
    await expect(searchAutocomplete('xyz-unique-c')).rejects.toThrow('aborted');
  });
});

describe('fetchCidsByName', () => {
  it('extracts the CID list', async () => {
    vi.stubGlobal('fetch', routeFetch([
      { match: '/cids/', data: { IdentifierList: { CID: [5793, 79025] } } },
    ]));
    expect(await fetchCidsByName('glucose')).toEqual([5793, 79025]);
  });

  it('returns [] on 404', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '/cids/', data: {}, status: 404 }]));
    expect(await fetchCidsByName('nonexistent')).toEqual([]);
  });
});

describe('fetchPropsByCids', () => {
  it('maps properties incl. MW/IUPAC and drops entries without a formula', async () => {
    vi.stubGlobal('fetch', routeFetch([
      {
        match: '/property/',
        data: {
          PropertyTable: {
            Properties: [
              { CID: 962, MolecularFormula: 'H2O', MolecularWeight: '18.015', Title: 'Water', IUPACName: 'oxidane' },
              { CID: 111, Title: 'no-formula' }, // dropped
            ],
          },
        },
      },
    ]));
    const out = await fetchPropsByCids([962, 111]);
    expect(out).toEqual([
      { cid: 962, molecularFormula: 'H2O', title: 'Water', molecularWeight: '18.015', iupacName: 'oxidane' },
    ]);
  });

  it('returns [] for an empty cid list without fetching', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await fetchPropsByCids([])).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('resolveByName / resolveByCas', () => {
  it('resolves a name to candidate compounds', async () => {
    vi.stubGlobal('fetch', routeFetch([
      { match: '/cids/', data: { IdentifierList: { CID: [702] } } },
      { match: '/property/', data: { PropertyTable: { Properties: [{ CID: 702, MolecularFormula: 'C2H6O', Title: 'Ethanol' }] } } },
    ]));
    const out = await resolveByName('ethanol');
    expect(out[0].molecularFormula).toBe('C2H6O');
  });

  it('throws PubChemError when a name matches nothing', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '/cids/', data: {}, status: 404 }]));
    await expect(resolveByName('zzzznope')).rejects.toBeInstanceOf(PubChemError);
  });

  it('throws PubChemError when a CAS matches nothing', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '/cids/', data: {}, status: 404 }]));
    await expect(resolveByCas('0000-00-0')).rejects.toBeInstanceOf(PubChemError);
  });
});

describe('helpers', () => {
  it('structureImageUrl builds a PNG endpoint', () => {
    expect(structureImageUrl(702)).toBe(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/702/PNG',
    );
  });

  it('isAbortError detects AbortError by name', () => {
    expect(isAbortError(Object.assign(new Error(), { name: 'AbortError' }))).toBe(true);
    expect(isAbortError(new Error('other'))).toBe(false);
  });
});
