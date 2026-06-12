/**
 * src/data/ionization-energies.ts
 *
 * Second ionization energies (IE₂, in eV) for elements, used to decide which
 * elements form appreciable doubly-charged ions (M²⁺) in the ICP.
 *
 * Physical criterion (charge-transfer ionization in the argon plasma):
 *   An element forms appreciable M²⁺ when its SECOND ionization energy is below
 *   the FIRST ionization energy of argon (IE₁(Ar) = 15.7596 eV). Below this
 *   threshold the reaction  Ar⁺ + M → Ar + M²⁺  is energetically favourable.
 *   Ref: Thomas, R. (2013) Practical Guide to ICP-MS, 3rd ed., CRC Press, ch.
 *        on doubly-charged species; Jarvis, K.E. et al. (1992) ICP-MS, ch. 5.
 *
 * Source of IE₂ values:
 *   Wikipedia "Ionization energies of the elements (data page)" (compiled from
 *   NIST Atomic Spectra Database and CRC Handbook of Chemistry & Physics).
 *   https://en.wikipedia.org/wiki/Ionization_energies_of_the_elements_(data_page)
 *   Access date: 2026-06-12
 *
 * Notes:
 * - Values are the second ionization energy in electronvolts (eV).
 * - Elements absent from this table are treated as NON-formers of M²⁺ by the
 *   engine (conservative default). The heavy refractory metals Ta, W, Re, Os, Ir
 *   are intentionally omitted because their IE₂ is comfortably above the 15.76 eV
 *   threshold (≈16–18 eV) — they do not form M²⁺ — and reliable eV values were
 *   not available from the primary source above.
 */

/** First ionization energy of argon (eV) — the M²⁺ formation threshold. */
export const AR_FIRST_IONIZATION_EV = 15.7596;

/**
 * Second ionization energy (eV) keyed by element symbol.
 * An element with SECOND_IONIZATION_ENERGY[sym] < AR_FIRST_IONIZATION_EV is an
 * M²⁺ former (see generateDoublyCharged in src/engine/interference.ts).
 */
export const SECOND_IONIZATION_ENERGY: Record<string, number> = {
  // ── M²⁺ formers (IE₂ < 15.76 eV) ──────────────────────────────────────────
  Mg: 15.03528,
  Ca: 11.87172,
  Sc: 12.79967,
  Ti: 13.5755,
  V: 14.66,
  Mn: 15.63999, // monoisotopic (⁵⁵Mn, odd) — never yields integer m/z M²⁺
  Sr: 11.03013,
  Y: 12.24,
  Zr: 13.13,
  Nb: 14.32,
  Tc: 15.26, // radioactive; included for completeness
  Sn: 14.63225,
  Ba: 10.00390,
  La: 11.060,
  Ce: 10.85,
  Pr: 10.55,
  Nd: 10.73,
  Sm: 11.07,
  Eu: 11.241,
  Gd: 12.09,
  Tb: 11.52,
  Dy: 11.67,
  Ho: 11.80,
  Er: 11.93,
  Tm: 12.05,
  Yb: 12.1761,
  Lu: 13.9,
  Hf: 14.9,
  Pb: 15.0322,
  Th: 11.5,
  U: 14.72,

  // ── Non-formers (IE₂ ≥ 15.76 eV) — included for transparency/completeness ──
  Li: 75.64009,
  Be: 18.21115,
  B: 25.15484,
  C: 24.38332,
  N: 29.6013,
  O: 35.11730,
  F: 34.97082,
  Na: 47.2864,
  Al: 18.82856,
  Si: 16.34585,
  P: 19.7694,
  S: 23.3379,
  Cl: 23.814,
  Ar: 27.62967,
  K: 31.63,
  Cr: 16.4857,
  Fe: 16.1878,
  Co: 17.083,
  Ni: 18.16884,
  Cu: 20.29240,
  Zn: 17.96440,
  Ga: 20.5142,
  Ge: 15.93462,
  As: 18.633,
  Se: 21.19,
  Rb: 27.285,
  Mo: 16.16,
  Ru: 16.76,
  Rh: 18.08,
  Pd: 19.43,
  Ag: 21.49,
  Cd: 16.90832,
  In: 18.8698,
  Sb: 16.53051,
  Te: 18.6,
  Cs: 23.15745,
  Pt: 18.563,
  Au: 20.5,
  Hg: 18.756,
  Tl: 20.428,
  Bi: 16.69,
};
