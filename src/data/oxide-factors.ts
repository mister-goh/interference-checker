/**
 * src/data/oxide-factors.ts
 *
 * Relative oxide-formation tendency per element, used to make oxide-type
 * polyatomic interferences (MO⁺, MO₂⁺, MOH⁺) more realistic in the engine.
 *
 * Rationale:
 *   The interference engine estimates a polyatomic's relative intensity from the
 *   product of its precursors' isotopic abundances. For oxide species this
 *   implicitly assumes every metal atom forms the oxide equally — which is not
 *   physically true. Refractory elements (REE, Ti, Zr, Hf, Nb, Ta, Th, U, …) form
 *   strong, persistent monoxides in the plasma, whereas soft/noble/alkali metals
 *   (Na, K, Cu, Zn, Ag, Cd, Au, Hg, Pb, Bi, …) barely form oxides at all. The
 *   discriminator is the metal–oxygen bond dissociation energy D₀(M–O): refractory
 *   oxide-formers have D₀(M–O) ≳ 5 eV; poor formers have D₀(M–O) ≲ 4 eV.
 *
 * Model (deliberately conservative — a RELATIVE ranking adjustment, NOT an
 * absolute MO⁺/M⁺ yield):
 *   - Default factor = 1.0 (refractory + moderate + unlisted elements). This
 *     preserves the original, literature-validated severity for the oxide species
 *     the tool was calibrated on (e.g. HfO₂⁺, ArO⁺, TiO⁺).
 *   - Poor oxide-formers (low D₀(M–O), negligible MO⁺ in practice) are
 *     down-weighted to suppress implausible oxide flags (e.g. NaO⁺, ZnO⁺, PbO⁺).
 *
 * Sources:
 *   - Bond dissociation energy groupings: CRC Handbook of Chemistry & Physics,
 *     "Bond dissociation energies" (diatomic M–O); Luo, Y.-R. (2007)
 *     Comprehensive Handbook of Chemical Bond Energies, CRC Press.
 *   - Refractory-oxide behaviour in ICP-MS: Thomas, R. (2013) Practical Guide to
 *     ICP-MS, 3rd ed., CRC Press (oxide-ratio discussion).
 *   Access date: 2026-06-12
 */

/** Down-weight applied to oxide species from poor (soft/noble/alkali) oxide-formers. */
const POOR_OXIDE_FACTOR = 0.1;

/**
 * Oxide-formation factor keyed by element symbol. Default (absent key) = 1.0.
 * Only elements that deviate from the default are listed.
 *
 * Poor oxide-formers — D₀(M–O) ≲ 4 eV, negligible monoxide in the ICP:
 *   alkali (Li, Na, K, Rb, Cs), coinage (Cu, Ag, Au), group 12 (Zn, Cd, Hg),
 *   soft post-transition (Ga, In, Tl, Pb, Bi).
 */
export const OXIDE_FACTOR: Record<string, number> = {
  Li: POOR_OXIDE_FACTOR,
  Na: POOR_OXIDE_FACTOR,
  K: POOR_OXIDE_FACTOR,
  Rb: POOR_OXIDE_FACTOR,
  Cs: POOR_OXIDE_FACTOR,
  Cu: POOR_OXIDE_FACTOR,
  Ag: POOR_OXIDE_FACTOR,
  Au: POOR_OXIDE_FACTOR,
  Zn: POOR_OXIDE_FACTOR,
  Cd: POOR_OXIDE_FACTOR,
  Hg: POOR_OXIDE_FACTOR,
  Ga: POOR_OXIDE_FACTOR,
  In: POOR_OXIDE_FACTOR,
  Tl: POOR_OXIDE_FACTOR,
  Pb: POOR_OXIDE_FACTOR,
  Bi: POOR_OXIDE_FACTOR,
};

/** Oxide-formation factor for an element (defaults to 1.0 when unlisted). */
export const oxideFactorOf = (sym: string): number => OXIDE_FACTOR[sym] ?? 1;
