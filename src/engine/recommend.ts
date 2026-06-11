/**
 * recommend.ts
 *
 * For each ICP-MS-measurable element, picks the best isotope mass to measure
 * given the computed interferences, then returns a ranked Recommendation list.
 *
 * Fallback order (status priority):
 *   clean > avoidable > mode-required > difficult > not-analyzable
 *
 * Tie-break within same status (fully deterministic — required for export
 * snapshot stability):
 *   1. abundance descending
 *   2. massNumber ascending
 *
 * Monoisotopic elements (e.g. As-75) receive alternativeMasses = [].
 *
 * DRC/KED mode assignment rules:
 *   clean         → Standard
 *   avoidable     → KED(He)   (low/medium polyatomic reducible by He KED)
 *   mode-required → a DRC gas (NH3/O2/H2). Preference by interference type
 *                   (oxide-only → O2, otherwise NH3), falling back to any other
 *                   ENABLED DRC gas (priority NH3 > O2 > H2). Never names a
 *                   disabled gas. H2 is recommended only as a fallback / when it
 *                   is the sole enabled gas.
 *   difficult     → Standard  (isobaric — no reliable mode for all-mass interference)
 *   not-analyzable → Standard (caps-gated — user should enable a required mode)
 *
 * Pure function — no React/DOM/I-O dependencies.
 */

import type {
  Interference,
  InstrumentCapabilities,
  IsotopeDetail,
  MeasurementMode,
  MatrixState,
  Recommendation,
  RecommendationStatus,
} from '../types';
import type { Composition } from './formula-parser';
import { ELEMENTS, ISOTOPES } from '../data/isotopes';
import { generateInterferences } from './interference';
import type { ElementWeights } from './interference';

// ─────────────────────────────────────────────────────────────────────────────
// Status priority (lower index = better)
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_RANK: Record<RecommendationStatus, number> = {
  clean:            0,
  avoidable:        1,
  'mode-required':  2,
  difficult:        3,
  'not-analyzable': 4,
};

// Engine fallback when caps omitted: permissive (every mode available) so that
// 2-arg recommend() callers keep the original behaviour. The App seeds its own
// user-facing default (NH3-only) separately — these two roles are intentionally
// distinct (engine = backward-compat fallback, App = the user's instrument).
const DEFAULT_CAPS: InstrumentCapabilities = {
  KED: true,
  DRC: { NH3: true, O2: true, H2: true },
};

// "DRC available" = at least one reaction gas is enabled.
const anyDRC = (caps: InstrumentCapabilities): boolean =>
  caps.DRC.NH3 || caps.DRC.O2 || caps.DRC.H2;

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the full recommendation pipeline for a compound.
 *
 * @param compoundComposition  Parsed element → atom-count map
 * @param matrix               Active matrix toggle state
 * @param caps                 Instrument capabilities (default: KED+DRC both ON)
 * @returns One Recommendation per ICP-MS-measurable element
 */
export function recommend(
  compoundComposition: Composition,
  matrix: MatrixState,
  caps: InstrumentCapabilities = DEFAULT_CAPS,
  weights: ElementWeights = {},
): Recommendation[] {
  // Collect all measurable elements
  const measurableElements = ELEMENTS.filter(el => el.icpmsMeasurable);

  // Build isotope lookup per element
  const isotopesByElement = new Map<string, typeof ISOTOPES>();
  for (const iso of ISOTOPES) {
    const list = isotopesByElement.get(iso.elementSymbol) ?? [];
    list.push(iso);
    isotopesByElement.set(iso.elementSymbol, list);
  }

  const recommendations: Recommendation[] = [];

  for (const element of measurableElements) {
    const isotopes = isotopesByElement.get(element.symbol) ?? [];
    if (isotopes.length === 0) continue;

    // For each isotope, compute all interferences at that mass
    const candidates: Array<{
      massNumber: number;
      exactMass: number;
      abundance: number;
      interferences: Interference[];
      status: RecommendationStatus;
    }> = [];

    for (const iso of isotopes) {
      const interferences = generateInterferences(
        iso.massNumber,
        compoundComposition,
        matrix,
        weights,
      );

      // Remove self-isobaric (same element) — the analyte IS this isotope
      const relevant = interferences.filter(
        inf => !inf.precursorElements.every(el => el === element.symbol)
               || inf.type !== 'isobaric',
      );

      const status = classifyStatus(relevant, caps);

      candidates.push({
        massNumber: iso.massNumber,
        exactMass: iso.exactMass,
        abundance: iso.abundance,
        interferences: relevant,
        status,
      });
    }

    // Sort candidates by status rank, then abundance desc, then massNumber asc
    candidates.sort((a, b) => {
      const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (rankDiff !== 0) return rankDiff;
      if (b.abundance !== a.abundance) return b.abundance - a.abundance;
      return a.massNumber - b.massNumber;
    });

    const best = candidates[0];
    const alternativeMasses = isotopes.length === 1
      ? []
      : candidates.slice(1).map(c => c.massNumber);

    const recommendedMode = assignMode(best.status, best.interferences, caps);

    // Per-isotope breakdown (mass ascending) for the detail popup.
    const isotopeDetails: IsotopeDetail[] = candidates
      .map(c => ({
        massNumber: c.massNumber,
        exactMass: c.exactMass,
        abundance: c.abundance,
        status: c.status,
        recommendedMode: assignMode(c.status, c.interferences, caps),
        interferences: c.interferences,
        isRecommended: c.massNumber === best.massNumber,
      }))
      .sort((a, b) => a.massNumber - b.massNumber);

    recommendations.push({
      elementSymbol: element.symbol,
      elementName: element.name,
      recommendedMass: best.massNumber,
      abundance: best.abundance,
      interferences: best.interferences,
      status: best.status,
      recommendedMode,
      alternativeMasses,
      isotopes: isotopeDetails,
    });
  }

  return recommendations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Status classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify a mass based on its interference list and instrument capabilities.
 *
 * Judgement is based on the RESIDUAL interference set — interferences that the
 * available modes can remove are treated as removed, and the worst remaining
 * interference determines the status. Raw .some() short-circuit is avoided
 * to prevent mixed-interference misclassification (test case d).
 *
 * clean          — no interferences
 * avoidable      — only low/medium polyatomic (KED ON removes them)
 * mode-required  — high polyatomic or M²⁺ where the required mode is available
 * difficult      — isobaric interference (mode-independent, always difficult)
 * not-analyzable — required mode(s) are disabled by caps; enabling them would
 *                  resolve the interference (user action needed)
 *
 * Correction vs. original code:
 *   Low/medium M²⁺ was previously classified as 'avoidable' (:166 original).
 *   KED physically cannot remove doubly-charged ions (energy discrimination
 *   is insufficient). These cases are now mode-required (DRC ON) or
 *   not-analyzable (DRC OFF). The old comment "doubly-charged → avoidable"
 *   is removed.
 */
function classifyStatus(
  interferences: Interference[],
  caps: InstrumentCapabilities,
): RecommendationStatus {
  if (interferences.length === 0) return 'clean';

  // Isobaric: no mode can remove — always difficult regardless of caps.
  const hasIsobaric = interferences.some(i => i.type === 'isobaric');
  if (hasIsobaric) return 'difficult';

  // Separate interference types for residual-set analysis.
  const hasHighPolyatomic = interferences.some(
    i => i.type === 'polyatomic' && i.severity === 'high',
  );
  const hasLowMidPolyatomic = interferences.some(
    i => i.type === 'polyatomic' && (i.severity === 'medium' || i.severity === 'low'),
  );
  const hasDoublyCharged = interferences.some(i => i.type === 'doubly-charged');

  // ── Doubly-charged (M²⁺) — severity does not matter ──────────────────────
  // KED cannot remove doubly-charged ions regardless of severity.
  // Only DRC can. Evaluate first because a mixed mass (polyatomic+M²⁺) must
  // consider all residual interferences together (test case d).
  if (hasDoublyCharged) {
    if (hasHighPolyatomic) {
      // Both high polyatomic AND M²⁺ present.
      // DRC removes both → mode-required if DRC ON; not-analyzable if DRC OFF.
      if (anyDRC(caps)) return 'mode-required';
      return 'not-analyzable';
    }
    if (hasLowMidPolyatomic) {
      // M²⁺ + low/mid polyatomic.
      // KED removes the polyatomic part but NOT the M²⁺.
      // DRC removes both. If DRC OFF, the M²⁺ remains — not-analyzable.
      if (anyDRC(caps)) return 'mode-required';
      return 'not-analyzable';
    }
    // M²⁺ only (no polyatomic component).
    if (anyDRC(caps)) return 'mode-required';
    return 'not-analyzable';
  }

  // ── Polyatomic only ───────────────────────────────────────────────────────
  if (hasHighPolyatomic) {
    // High polyatomic requires DRC.
    if (anyDRC(caps)) return 'mode-required';
    return 'not-analyzable';
  }

  // Low/medium polyatomic only — KED(He) removes these.
  // (DRC state is irrelevant; KED path preserved from original assignMode :181-182)
  if (hasLowMidPolyatomic) {
    if (caps.KED) return 'avoidable';
    if (anyDRC(caps)) return 'mode-required';
    return 'not-analyzable';
  }

  // No interference matched any known type — treat as clean (defensive).
  return 'clean';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode assignment
// ─────────────────────────────────────────────────────────────────────────────

type DRCGas = 'NH3' | 'O2' | 'H2';

/**
 * Pick the DRC reaction gas to recommend for a mode-required mass, honouring
 * which gases are actually enabled (preference + fallback).
 *
 * Preference (unchanged heuristic): oxide-only interference (O present, no Ar)
 * → O2, otherwise → NH3. If the preferred gas is disabled, fall back to the
 * first enabled gas by priority NH3 (most versatile) > O2 > H2. Returns null
 * only when no DRC gas is enabled — which classifyStatus prevents for the
 * mode-required status (it gates on anyDRC).
 */
function pickDRCGas(
  interferences: Interference[],
  caps: InstrumentCapabilities,
): DRCGas | null {
  const hasDoublyCharged = interferences.some(i => i.type === 'doubly-charged');
  let preferred: DRCGas;
  if (hasDoublyCharged) {
    // Use O2 only when all polyatomic co-interferences are oxide-based (no Ar).
    const polyatomics = interferences.filter(i => i.type === 'polyatomic');
    const oxideOnly =
      polyatomics.length > 0 &&
      polyatomics.every(
        i => i.precursorElements.includes('O') && !i.precursorElements.includes('Ar'),
      );
    preferred = oxideOnly ? 'O2' : 'NH3';
  } else {
    const hasArBased = interferences.some(i => i.precursorElements.includes('Ar'));
    const hasOxideBased = interferences.some(
      i => i.type === 'polyatomic' &&
           i.precursorElements.includes('O') &&
           !i.precursorElements.includes('Ar'),
    );
    preferred = hasOxideBased && !hasArBased ? 'O2' : 'NH3';
  }

  // Preferred first, then fall back to any other enabled gas.
  const priority: DRCGas[] = [preferred, 'NH3', 'O2', 'H2'];
  for (const gas of priority) {
    if (caps.DRC[gas]) return gas;
  }
  return null;
}

function assignMode(
  status: RecommendationStatus,
  interferences: Interference[],
  caps: InstrumentCapabilities,
): MeasurementMode {
  switch (status) {
    case 'clean':
      return 'Standard';

    case 'avoidable':
      // KED must be ON for this status to have been assigned.
      return 'KED(He)';

    case 'mode-required': {
      // mode-required ⟹ anyDRC(caps) is true (classifyStatus gate), so a gas is
      // always found here. The null branch is defensive only.
      const gas = pickDRCGas(interferences, caps);
      if (gas) return `DRC(${gas})`;
      return 'Standard';
    }

    case 'difficult':
      // No single-mode solution — report Standard with note in UI.
      return 'Standard';

    case 'not-analyzable':
      // Required mode is disabled; Standard is the only thing we can report.
      // UI should surface the "enable the mode" call-to-action.
      return 'Standard';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation rationale (pure, for the detail popup)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable (Korean) explanation of why the recommended mass was chosen,
 * derived from the per-isotope breakdown and the ranking (status > abundance >
 * massNumber). Pure function — no side effects.
 */
export function explainRecommendation(rec: Recommendation): string {
  const isos = rec.isotopes;
  if (isos.length <= 1) {
    return `단일 동위원소(m/z ${rec.recommendedMass})라 측정 질량 선택지가 없습니다.`;
  }
  const cleanCount = isos.filter(i => i.status === 'clean').length;
  const m = rec.recommendedMass;
  switch (rec.status) {
    case 'clean':
      return cleanCount > 1
        ? `간섭 없는 질량이 ${cleanCount}개 있으며, 그중 존재비가 가장 높은 m/z ${m}을 선정했습니다.`
        : `유일하게 간섭이 없는 m/z ${m}을 선정했습니다.`;
    case 'avoidable':
      return `간섭이 없는 질량이 없어, He KED로 회피 가능한 질량 중 존재비가 가장 높은 m/z ${m}을 선정했습니다.`;
    case 'mode-required':
      return `모든 질량에 제거가 필요한 간섭이 있어, 판정 등급이 가장 양호하고 존재비가 높은 m/z ${m}을 선정했습니다 (${rec.recommendedMode} 필요).`;
    case 'difficult':
      return `모든 질량에 모드로 제거할 수 없는 동질량(isobaric) 간섭이 있어, 그중 존재비가 가장 높은 m/z ${m}을 선정했습니다.`;
    case 'not-analyzable':
      return `현재 모드 구성으로는 모든 질량의 간섭을 제거할 수 없어 분석이 어렵습니다 (m/z ${m} 기준). 측정 모드 가용성에서 KED/DRC를 활성화해 보세요.`;
  }
}
