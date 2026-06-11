/**
 * src/data/compound-aliases.ts
 *
 * Curated abbreviation → compound map for semiconductor precursors whose common
 * trade abbreviations (BTBAS, 3DMAS, …) are NOT registered as PubChem synonyms,
 * so the PubChem name search returns 404. Each entry's formula/CID was verified
 * against PubChem PUG REST (name → MolecularFormula, CID).
 *
 * Source: PubChem (https://pubchem.ncbi.nlm.nih.gov/), accessed 2026-06-11.
 *
 * Resolving via this table is OFFLINE (formula is stored locally) and avoids the
 * abbreviation-lookup gap entirely. PubChem remains the fallback for everything
 * not listed here.
 *
 * `formula` uses the PubChem Hill formula so the displayed formula matches what
 * the interference engine computes. All formulas must parse via
 * engine/formula-parser (guarded by compound-aliases.test.ts).
 */

export interface CompoundAlias {
  /** Match keys (abbreviations / variants). Matched case-insensitively. */
  aliases: string[]
  /** Display name + PubChem-resolvable canonical name. */
  canonicalName: string
  /** PubChem Hill molecular formula (engine-parseable, offline). */
  formula: string
  /** PubChem CID (for reference links). */
  cid?: number
  /**
   * Proprietary precursor whose exact structure is not disclosed — only the
   * center element is modeled (formula = the element symbol). Combined with the
   * congener map this still surfaces center-metal + congener interferences.
   */
  centerMetalOnly?: boolean
}

export const COMPOUND_ALIASES: CompoundAlias[] = [
  {
    aliases: ['3DMAS', 'TDMAS'],
    canonicalName: 'Tris(dimethylamino)silane',
    formula: 'C6H19N3Si',
    cid: 84795,
  },
  {
    aliases: ['BTBAS'],
    canonicalName: 'Bis(tert-butylamino)silane',
    formula: 'C8H22N2Si',
    cid: 57370846,
  },
  {
    aliases: ['OMCTS'],
    canonicalName: 'Octamethylcyclotetrasiloxane',
    formula: 'C8H24O4Si4',
    cid: 11169,
  },
  {
    aliases: ['CPME'],
    canonicalName: 'Cyclopentyl methyl ether',
    formula: 'C6H12O',
    cid: 138539,
  },
  {
    aliases: ['TDMAT', 'TDMATi'],
    canonicalName: 'Tetrakis(dimethylamino)titanium',
    formula: 'C8H24N4Ti',
    cid: 123185,
  },
  {
    aliases: ['TEMAH', 'TEMAHf'],
    canonicalName: 'Tetrakis(ethylmethylamino)hafnium',
    formula: 'C12H32HfN4',
    cid: 4103752,
  },
  {
    aliases: ['TEMAZ', 'TEMAZr'],
    canonicalName: 'Tetrakis(ethylmethylamino)zirconium',
    formula: 'C12H32N4Zr',
    cid: 4446313,
  },
  {
    aliases: ['BDEAS'],
    canonicalName: 'Bis(diethylamino)silane',
    formula: 'C8H20N2Si',
    cid: 14908161,
  },
  {
    aliases: ['TEPO'],
    canonicalName: 'Triethyl phosphate',
    formula: 'C6H15O4P',
    cid: 6535,
  },
  {
    aliases: ['TEB'],
    canonicalName: 'Triethylborane',
    formula: 'C6H15B',
    cid: 7357,
  },
  {
    aliases: ['4MS'],
    canonicalName: 'Tetramethylsilane',
    formula: 'C4H12Si',
    cid: 6396,
  },
  {
    aliases: ['TMDSO'],
    canonicalName: '1,1,3,3-Tetramethyldisiloxane',
    formula: 'C4H12OSi2',
    cid: 6327482,
  },
  // Simple halides — parser-trivial, added for offline/quick selection
  {
    aliases: ['SiCl4'],
    canonicalName: 'Silicon tetrachloride',
    formula: 'SiCl4',
  },
  {
    aliases: ['HfCl4'],
    canonicalName: 'Hafnium tetrachloride',
    formula: 'HfCl4',
  },
  {
    aliases: ['BBr3'],
    canonicalName: 'Boron tribromide',
    formula: 'BBr3',
  },
  // ── Center-metal-only (proprietary precursors; structure not modeled) ──
  {
    aliases: ['CpHf'],
    canonicalName: 'Hafnium (Cp 전구체 · 중심금속)',
    formula: 'Hf',
    centerMetalOnly: true,
  },
  {
    aliases: ['CpZr'],
    canonicalName: 'Zirconium (Cp 전구체 · 중심금속)',
    formula: 'Zr',
    centerMetalOnly: true,
  },
  {
    aliases: ['BDMAMS'],
    canonicalName: 'BDMAMS (중심원소 Si)',
    formula: 'Si',
    centerMetalOnly: true,
  },
  {
    aliases: ['Y'],
    canonicalName: 'Yttrium (중심금속)',
    formula: 'Y',
    centerMetalOnly: true,
  },
  {
    aliases: ['La'],
    canonicalName: 'Lanthanum (중심금속)',
    formula: 'La',
    centerMetalOnly: true,
  },
  {
    aliases: ['Sn'],
    canonicalName: 'Tin (중심금속)',
    formula: 'Sn',
    centerMetalOnly: true,
  },
  {
    aliases: ['Ta'],
    canonicalName: 'Tantalum (중심금속)',
    formula: 'Ta',
    centerMetalOnly: true,
  },
  {
    aliases: ['Te'],
    canonicalName: 'Tellurium (중심금속)',
    formula: 'Te',
    centerMetalOnly: true,
  },
  {
    aliases: ['Nb'],
    canonicalName: 'Niobium (중심금속)',
    formula: 'Nb',
    centerMetalOnly: true,
  },
]

// ── Lookup helpers (pure) ───────────────────────────────────────────────────

/**
 * Exact (case-insensitive, trimmed) resolution against any alias key or the
 * canonical name. Returns null when nothing matches.
 */
export function resolveAlias(query: string): CompoundAlias | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const entry of COMPOUND_ALIASES) {
    if (entry.canonicalName.toLowerCase() === q) return entry
    if (entry.aliases.some((a) => a.toLowerCase() === q)) return entry
  }
  return null
}

/**
 * Substring match for autocomplete — matches alias keys or canonical name.
 * Returns at most `limit` entries (default 5), deduplicated by entry.
 */
export function searchAliases(query: string, limit = 5): CompoundAlias[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: CompoundAlias[] = []
  for (const entry of COMPOUND_ALIASES) {
    const hit =
      entry.canonicalName.toLowerCase().includes(q) ||
      entry.aliases.some((a) => a.toLowerCase().includes(q))
    if (hit) out.push(entry)
    if (out.length >= limit) break
  }
  return out
}
