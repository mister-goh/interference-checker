/**
 * interference.ts
 *
 * Generates all interference species for a given compound composition + matrix
 * toggles, then merges with curated interferences.
 *
 * Interference types generated:
 *   1. Isobaric  — element isotopes from compound that share integer m/z with
 *                  a target analyte isotope (same element excluded)
 *   2. Polyatomic (2-atom) — all pairwise MX⁺ combinations from the active
 *      element pool covering: MO⁺, MOH⁺, MH⁺, MCl⁺, ArM⁺, and every
 *      other 2-atom pairing whose masses sum to an integer analyte mass.
 *      Pool = compound elements ∪ active matrix elements.
 *   3. Doubly-charged (M²⁺) — curated elements only (Ba, Sr, REE, Pb).
 *      Even mass isotopes only (odd mass → half-integer m/z → excluded).
 *   4. Curated — merged from CURATED_INTERFERENCES after filtering active
 *      precursor elements.
 *
 * Severity (half-open intervals, precursor fractional-abundance product as %):
 *   high   : p ≥ 1.0%
 *   medium : 0.01% ≤ p < 1.0%
 *   low    : p < 0.01%
 *
 * Pure function — no React/DOM/I-O dependencies.
 */

import type { Interference, MatrixState, Severity } from '../types';
import type { Composition } from './formula-parser';
import { ISOTOPES } from '../data/isotopes';
import { CURATED_INTERFERENCES } from '../data/curated-interferences';
import { SECOND_IONIZATION_ENERGY, AR_FIRST_IONIZATION_EV } from '../data/ionization-energies';
import { oxideFactorOf } from '../data/oxide-factors';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Whether an element forms appreciable doubly-charged ions (M²⁺) in the ICP.
 *
 * Physical criterion: M²⁺ forms when the element's SECOND ionization energy is
 * below the FIRST ionization energy of argon (15.76 eV) — the charge-transfer
 * reaction Ar⁺ + M → Ar + M²⁺ is then energetically favourable.
 *
 * This replaces the former hard-coded Ba/Sr/REE/Pb list with a data-driven
 * criterion, which additionally captures Ca, Sc, Ti, V, Y, Zr, Nb, Sn, Hf, Th, U
 * (all literature-recognised M²⁺ formers). Elements with no IE₂ datum default to
 * non-formers (conservative).
 * Ref: Thomas (2013 3rd ed.); Jarvis (1992). See src/data/ionization-energies.ts.
 */
function formsDoublyCharged(sym: string): boolean {
  const ie2 = SECOND_IONIZATION_ENERGY[sym];
  return ie2 !== undefined && ie2 < AR_FIRST_IONIZATION_EV;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build lookup: elementSymbol → Isotope[]
// ─────────────────────────────────────────────────────────────────────────────

const ISOTOPES_BY_ELEMENT: Map<string, typeof ISOTOPES> = new Map();
for (const iso of ISOTOPES) {
  const list = ISOTOPES_BY_ELEMENT.get(iso.elementSymbol) ?? [];
  list.push(iso);
  ISOTOPES_BY_ELEMENT.set(iso.elementSymbol, list);
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity helper
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a precursor abundance product (%) to a severity level. */
export function toSeverity(productPct: number): Severity {
  if (productPct >= 1.0) return 'high';
  if (productPct >= 0.01) return 'medium';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Unicode superscript helpers
// ─────────────────────────────────────────────────────────────────────────────

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

function superscript(n: number): string {
  return String(n).split('').map(c => SUP[c] ?? c).join('');
}

function fmtSpecies(massNumber: number, symbol: string): string {
  return `${superscript(massNumber)}${symbol}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all interferences relevant to the given compound composition and
 * matrix state, for a specific target integer mass.
 *
 * Returns deduplicated interferences (by composition string).
 */
export function generateInterferences(
  targetMass: number,
  compoundComposition: Composition,
  matrix: MatrixState,
  weights: ElementWeights = {},
): Interference[] {
  // Active element pool = compound elements + toggled matrix elements
  const activeElements = buildActiveElements(compoundComposition, matrix);

  const results = new Map<string, Interference>(); // keyed by composition string

  // 1. Isobaric interferences (compound elements that share this integer mass)
  generateIsobaric(targetMass, compoundComposition, results, weights);

  // 2. Two-atom polyatomic combinations
  generatePolyatomic(targetMass, activeElements, results, weights);

  // 2b. Three-atom oxide species: metal dioxide MO₂⁺ and hydroxide MOH⁺
  generateOxideTriatomic(targetMass, activeElements, results, weights);

  // 2c. Argon-dimer background triatomics: Ar₂X⁺ (X = active light matrix gas)
  generateArgonDimerTriatomic(targetMass, activeElements, results, weights);

  // 3. Doubly-charged M²⁺ (even mass only, curated elements only)
  generateDoublyCharged(targetMass, activeElements, results, weights);

  // 4. Merge curated interferences (filtered to active precursors)
  mergeCurated(targetMass, activeElements, results);

  return Array.from(results.values());
}

/**
 * Per-element abundance multiplier (default 1). Used to down-weight interferences
 * from congener impurity elements present at a fractional concentration — e.g.
 * Zr at 2% in an Hf matrix → weight 0.02. Absent keys default to 1.
 */
export type ElementWeights = Record<string, number>;

const weightOf = (weights: ElementWeights, sym: string): number =>
  weights[sym] ?? 1;

// ─────────────────────────────────────────────────────────────────────────────
// Active element pool
// ─────────────────────────────────────────────────────────────────────────────

function buildActiveElements(
  composition: Composition,
  matrix: MatrixState,
): Set<string> {
  const pool = new Set<string>(Object.keys(composition));

  // Matrix elements — Ar is always active
  pool.add('Ar');
  if (matrix.H)  pool.add('H');
  if (matrix.N)  pool.add('N');
  if (matrix.O)  pool.add('O');
  if (matrix.C)  pool.add('C');
  if (matrix.Cl) pool.add('Cl');

  return pool;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Isobaric
// ─────────────────────────────────────────────────────────────────────────────

function generateIsobaric(
  targetMass: number,
  composition: Composition,
  out: Map<string, Interference>,
  weights: ElementWeights,
): void {
  for (const sym of Object.keys(composition)) {
    const isotopes = ISOTOPES_BY_ELEMENT.get(sym) ?? [];
    for (const iso of isotopes) {
      if (iso.massNumber !== targetMass) continue;
      const pct = iso.abundance * weightOf(weights, sym);
      const compositionStr = `${fmtSpecies(iso.massNumber, iso.elementSymbol)}⁺`;
      if (out.has(compositionStr)) continue;
      out.set(compositionStr, {
        type: 'isobaric',
        composition: compositionStr,
        targetMass,
        precursorElements: [sym],
        precursorAbundanceProduct: pct,
        severity: toSeverity(pct),
        source: 'calculated',
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Two-atom polyatomic combinations
// ─────────────────────────────────────────────────────────────────────────────

function generatePolyatomic(
  targetMass: number,
  activeElements: Set<string>,
  out: Map<string, Interference>,
  weights: ElementWeights,
): void {
  const elements = Array.from(activeElements);

  // For every ordered pair (A, B) — including A==B for homo-diatomic,
  // but those are handled in curated; skip them here to avoid duplicates
  // with the curated list.  We DO generate hetero-diatomic pairs.
  for (let i = 0; i < elements.length; i++) {
    const symA = elements[i];
    const isotopesA = ISOTOPES_BY_ELEMENT.get(symA) ?? [];

    for (let j = i; j < elements.length; j++) {
      const symB = elements[j];

      // Skip homo-diatomic: those are in the curated list
      if (symA === symB) continue;

      const isotopesB = ISOTOPES_BY_ELEMENT.get(symB) ?? [];

      for (const isoA of isotopesA) {
        for (const isoB of isotopesB) {
          if (isoA.massNumber + isoB.massNumber !== targetMass) continue;

          // Ordered so lower mass number comes first; ties broken alphabetically
          const [first, second] = orderPair(isoA, symA, isoB, symB);

          const compositionStr =
            `${fmtSpecies(first.massNumber, first.symbol)}` +
            `${fmtSpecies(second.massNumber, second.symbol)}⁺`;

          if (out.has(compositionStr)) continue;

          // Oxide species (MO⁺): scale by the metal's oxide-formation tendency so
          // implausible oxides (NaO⁺, ZnO⁺, …) are down-weighted. At most one of
          // the pair is 'O' (homo-diatomic O₂ is curated, not generated here);
          // matrix gases (Ar/N/C) default to factor 1 → unchanged.
          const oxidePartner = symA === 'O' ? symB : symB === 'O' ? symA : null;
          const oxideMult = oxidePartner ? oxideFactorOf(oxidePartner) : 1;

          const pct =
            (first.abundance / 100) * (second.abundance / 100) * 100 *
            weightOf(weights, symA) * weightOf(weights, symB) * oxideMult;
          out.set(compositionStr, {
            type: 'polyatomic',
            composition: compositionStr,
            targetMass,
            precursorElements: [...new Set([symA, symB])],
            precursorAbundanceProduct: pct,
            severity: toSeverity(pct),
            source: 'calculated',
          });
        }
      }
    }
  }
}

interface IsoPair { massNumber: number; abundance: number; symbol: string }

function orderPair(
  isoA: { massNumber: number; abundance: number },
  symA: string,
  isoB: { massNumber: number; abundance: number },
  symB: string,
): [IsoPair, IsoPair] {
  const a: IsoPair = { ...isoA, symbol: symA };
  const b: IsoPair = { ...isoB, symbol: symB };
  if (a.massNumber < b.massNumber) return [a, b];
  if (a.massNumber > b.massNumber) return [b, a];
  // Same mass — sort alphabetically by symbol
  return a.symbol <= b.symbol ? [a, b] : [b, a];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Three-atom oxide species — metal dioxide MO₂⁺ and hydroxide MOH⁺
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Refractory oxide interferences with two heavy-side atoms:
 *   - MO₂⁺  (metal + O + O)   e.g. ¹⁷⁷Hf¹⁶O₂⁺ → m/z 209 on ²⁰⁹Bi
 *   - MOH⁺  (metal + O + H)   e.g. ⁴⁰Ar¹⁶O¹H⁺ → m/z 57 on ⁵⁷Fe
 *
 * Requires O in the active pool (oxide formation needs oxygen); MOH additionally
 * requires H. The metal M is any active element except O (M=O would be ozone).
 * Atom order in the display string is M → O(s) → H, matching the curated triatomic
 * convention so mergeCurated() can override duplicates with literature values.
 */
function generateOxideTriatomic(
  targetMass: number,
  activeElements: Set<string>,
  out: Map<string, Interference>,
  weights: ElementWeights,
): void {
  if (!activeElements.has('O')) return;

  const oIsotopes = ISOTOPES_BY_ELEMENT.get('O') ?? [];
  const hIsotopes = activeElements.has('H')
    ? ISOTOPES_BY_ELEMENT.get('H') ?? []
    : [];

  for (const sym of activeElements) {
    if (sym === 'O') continue; // M=O would be O₃, not a metal oxide
    const isotopesM = ISOTOPES_BY_ELEMENT.get(sym) ?? [];

    for (const isoM of isotopesM) {
      // ── MO₂ (metal + two oxygens) ──
      for (let a = 0; a < oIsotopes.length; a++) {
        for (let b = a; b < oIsotopes.length; b++) {
          const oA = oIsotopes[a];
          const oB = oIsotopes[b];
          if (isoM.massNumber + oA.massNumber + oB.massNumber !== targetMass) continue;

          const oxidePart =
            oA.massNumber === oB.massNumber
              ? `${fmtSpecies(oA.massNumber, 'O')}₂`
              : `${fmtSpecies(oA.massNumber, 'O')}${fmtSpecies(oB.massNumber, 'O')}`;
          const compositionStr = `${fmtSpecies(isoM.massNumber, sym)}${oxidePart}⁺`;
          if (out.has(compositionStr)) continue;

          const pct =
            (isoM.abundance / 100) * (oA.abundance / 100) * (oB.abundance / 100) * 100 *
            weightOf(weights, sym) * weightOf(weights, 'O') * weightOf(weights, 'O') *
            oxideFactorOf(sym);
          out.set(compositionStr, {
            type: 'polyatomic',
            composition: compositionStr,
            targetMass,
            precursorElements: [...new Set([sym, 'O'])],
            precursorAbundanceProduct: pct,
            severity: toSeverity(pct),
            source: 'calculated',
          });
        }
      }

      // ── MOH (metal + oxygen + hydrogen) ──
      for (const o of oIsotopes) {
        for (const h of hIsotopes) {
          if (isoM.massNumber + o.massNumber + h.massNumber !== targetMass) continue;

          const compositionStr =
            `${fmtSpecies(isoM.massNumber, sym)}${fmtSpecies(o.massNumber, 'O')}` +
            `${fmtSpecies(h.massNumber, 'H')}⁺`;
          if (out.has(compositionStr)) continue;

          const pct =
            (isoM.abundance / 100) * (o.abundance / 100) * (h.abundance / 100) * 100 *
            weightOf(weights, sym) * weightOf(weights, 'O') * weightOf(weights, 'H') *
            oxideFactorOf(sym);
          out.set(compositionStr, {
            type: 'polyatomic',
            composition: compositionStr,
            targetMass,
            precursorElements: [...new Set([sym, 'O', 'H'])],
            precursorAbundanceProduct: pct,
            severity: toSeverity(pct),
            source: 'calculated',
          });
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2c. Argon-dimer background triatomics — Ar₂X⁺
// ─────────────────────────────────────────────────────────────────────────────

/** Light matrix gases that pair with an Ar₂ core to form Ar₂X⁺ background ions. */
const ARGON_DIMER_PARTNERS = ['H', 'C', 'N', 'O', 'Cl'] as const;

/**
 * Argon-dimer triatomics: Ar₂X⁺ where X is an active light matrix gas.
 * These plasma-background ions (e.g. ⁴⁰Ar₂¹H⁺ → m/z 81 on ⁸¹Br, ⁴⁰Ar₂¹⁴N⁺ →
 * m/z 94, ⁴⁰Ar₂¹⁶O⁺ → m/z 96) are not reachable by the pairwise two-atom engine.
 *
 * The display string uses the Ar-first convention ("⁴⁰Ar₂¹⁶O⁺"), matching the
 * curated triatomic list so mergeCurated() overrides the calibrated entries
 * (e.g. ⁴⁰Ar₂¹⁶O⁺ at m/z 96) with literature-precise values instead of leaving a
 * duplicate. Ar is always active; Ar₃ (X=Ar) is omitted as negligible.
 */
function generateArgonDimerTriatomic(
  targetMass: number,
  activeElements: Set<string>,
  out: Map<string, Interference>,
  weights: ElementWeights,
): void {
  const arIsotopes = ISOTOPES_BY_ELEMENT.get('Ar') ?? [];

  for (const X of ARGON_DIMER_PARTNERS) {
    if (!activeElements.has(X)) continue;
    const xIsotopes = ISOTOPES_BY_ELEMENT.get(X) ?? [];

    // Unordered Ar pair (a ≤ b) so each isotope combination appears once.
    for (let a = 0; a < arIsotopes.length; a++) {
      for (let b = a; b < arIsotopes.length; b++) {
        const arA = arIsotopes[a];
        const arB = arIsotopes[b];
        for (const x of xIsotopes) {
          if (arA.massNumber + arB.massNumber + x.massNumber !== targetMass) continue;

          const arPart =
            arA.massNumber === arB.massNumber
              ? `${fmtSpecies(arA.massNumber, 'Ar')}₂`
              : `${fmtSpecies(arA.massNumber, 'Ar')}${fmtSpecies(arB.massNumber, 'Ar')}`;
          const compositionStr = `${arPart}${fmtSpecies(x.massNumber, X)}⁺`;
          if (out.has(compositionStr)) continue;

          const pct =
            (arA.abundance / 100) * (arB.abundance / 100) * (x.abundance / 100) * 100 *
            weightOf(weights, 'Ar') * weightOf(weights, X);
          out.set(compositionStr, {
            type: 'polyatomic',
            composition: compositionStr,
            targetMass,
            precursorElements: [...new Set(['Ar', X])],
            precursorAbundanceProduct: pct,
            severity: toSeverity(pct),
            source: 'calculated',
          });
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Doubly-charged M²⁺
// ─────────────────────────────────────────────────────────────────────────────

function generateDoublyCharged(
  targetMass: number,
  activeElements: Set<string>,
  out: Map<string, Interference>,
  weights: ElementWeights,
): void {
  // The source element must be in the active pool AND form M²⁺ (IE₂ criterion)
  for (const sym of activeElements) {
    if (!formsDoublyCharged(sym)) continue;

    const isotopes = ISOTOPES_BY_ELEMENT.get(sym) ?? [];
    for (const iso of isotopes) {
      // Only even mass numbers produce integer m/z when halved.
      // Odd mass → half-integer m/z → NOT observed on quadrupole (1 amu resolution).
      if (iso.massNumber % 2 !== 0) continue;
      if (iso.massNumber / 2 !== targetMass) continue;

      const compositionStr = `${fmtSpecies(iso.massNumber, iso.elementSymbol)}²⁺`;
      if (out.has(compositionStr)) continue;

      const pct = iso.abundance * weightOf(weights, sym);
      out.set(compositionStr, {
        type: 'doubly-charged',
        composition: compositionStr,
        targetMass,
        precursorElements: [sym],
        precursorAbundanceProduct: pct,
        severity: toSeverity(pct),
        source: 'calculated',
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Curated interferences
// ─────────────────────────────────────────────────────────────────────────────

function mergeCurated(
  targetMass: number,
  activeElements: Set<string>,
  out: Map<string, Interference>,
): void {
  for (const ci of CURATED_INTERFERENCES) {
    if (ci.targetMass !== targetMass) continue;

    // Only include if all precursor elements are in the active pool
    const allActive = ci.precursorElements.every(el => activeElements.has(el));
    if (!allActive) continue;

    // Curated entry wins over a calculated duplicate (curated is more accurate)
    out.set(ci.composition, ci);
  }
}
