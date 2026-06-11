// Types matching PRD/02_DATA_MODEL.md exactly
// Generated for Isotope Searcher Phase 1

export interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  icpmsMeasurable: boolean;
}

export interface Isotope {
  elementSymbol: string;
  massNumber: number;
  exactMass: number;
  abundance: number; // % (e.g. 27.28)
}

export interface Compound {
  id: string;
  name: string;
  formula: string;
  composition: Record<string, number>; // { Hf: 1, Cl: 4 }
  category?: string;
  isBuiltin: boolean;
}

export type InterferenceType = 'isobaric' | 'polyatomic' | 'doubly-charged';
export type Severity = 'high' | 'medium' | 'low';
export type InterferenceSource = 'calculated' | 'curated';

export interface Interference {
  type: InterferenceType;
  composition: string; // display string e.g. "⁴⁰Ar³⁵Cl⁺"
  targetMass: number;
  precursorElements: string[];
  severity: Severity;
  source: InterferenceSource;
  precursorAbundanceProduct: number; // % — used to compute severity
}

export type RecommendationStatus = 'clean' | 'avoidable' | 'mode-required' | 'difficult' | 'not-analyzable';
export type MeasurementMode = 'Standard' | 'KED(He)' | 'DRC(NH3)' | 'DRC(O2)' | 'DRC(H2)';

/**
 * Instrument hardware capabilities.
 * Standard mode is always available and excluded from this type.
 * DRC is split per reaction gas (NH3/O2/H2) — the instrument may have only some
 * gases plumbed. Engine treats "DRC available" as "any gas enabled" and picks a
 * specific enabled gas (preference + fallback).
 */
export interface InstrumentCapabilities {
  KED: boolean; // KED(He) collision cell available
  DRC: {
    NH3: boolean;
    O2: boolean;
    H2: boolean;
  };
}

// Per-isotope analysis breakdown for an element (used by the detail popup).
export interface IsotopeDetail {
  massNumber: number;
  exactMass: number;
  abundance: number; // %
  status: RecommendationStatus;
  recommendedMode: MeasurementMode; // mode needed if this mass were used
  interferences: Interference[];    // self-isobaric removed
  isRecommended: boolean;
}

export interface Recommendation {
  elementSymbol: string;
  elementName: string; // full element name (e.g. "Silver") — display + sortable column
  recommendedMass: number;
  abundance: number; // % of recommended isotope
  interferences: Interference[];
  status: RecommendationStatus;
  recommendedMode: MeasurementMode;
  alternativeMasses: number[];
  isotopes: IsotopeDetail[]; // all isotopes of the element, mass ascending
}

// Matrix toggle state — which background elements are active
export interface MatrixState {
  Ar: boolean; // always true, plasma background; not user-controllable
  H: boolean;
  N: boolean;
  O: boolean;
  C: boolean;
  // Cl included for HCl/HCl-containing matrices; user-toggled
  Cl: boolean;
}

// Schema version for localStorage — bump when shape changes to avoid stale reads
export const FAVOURITES_SCHEMA_VERSION = 1 as const;

// User-saved favorite compound (localStorage schema v1)
export interface FavoriteCompound {
  schemaVersion: typeof FAVOURITES_SCHEMA_VERSION;
  id: string;
  name: string;
  formula: string;
  savedAt: string; // ISO 8601 UTC
}

// Schema version for element-preset localStorage — bump when shape changes
export const PRESETS_SCHEMA_VERSION = 1 as const;

// User-saved set of guaranteed/frequently-checked elements (localStorage schema v1)
export interface ElementPreset {
  schemaVersion: typeof PRESETS_SCHEMA_VERSION;
  id: string;
  name: string;
  symbols: string[]; // measurable element symbols, e.g. ['Na', 'Fe', 'Cu']
  savedAt: string; // ISO 8601 UTC
}

// Schema version for saved-analysis localStorage — bump when shape changes
export const SAVED_ANALYSIS_SCHEMA_VERSION = 1 as const;

/**
 * A full analysis snapshot — all the input state needed to reproduce a result.
 * Results are NOT stored; restoring re-runs the (deterministic) engine.
 */
export interface SavedAnalysis {
  schemaVersion: typeof SAVED_ANALYSIS_SCHEMA_VERSION;
  id: string;
  name: string;
  savedAt: string; // ISO 8601 UTC
  // Inputs that determine the result
  formula: string;
  compoundName: string;
  matrix: MatrixState;
  caps: InstrumentCapabilities;
  congenerEnabled: boolean;
  congenerOverrides: Record<string, number>;
  customCongeners: Record<string, number>;
  // View state (does not affect the computed result; restored for fidelity)
  activePresetId: string | null;
  activeStatuses: RecommendationStatus[];
  sorting: { id: string; desc: boolean }[];
}
