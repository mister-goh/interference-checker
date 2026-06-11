/**
 * src/data/isotopes.test.ts
 *
 * Verify correctness of the NIST isotope data layer.
 *
 * Test categories:
 *   A) Abundance sum guard — each element's isotopes sum to ~100% (±0.1%)
 *   B) Spot-check NIST values for ~15-20 key elements (literature cross-validation)
 *   C) icpmsMeasurable flags for non-measurable precursor elements
 *   D) ELEMENT_BY_SYMBOL and ISOTOPES_BY_ELEMENT lookup maps
 *   E) Curated interference data integrity
 */

import { describe, it, expect } from "vitest";
import {
  ELEMENTS,
  ISOTOPES,
  ELEMENT_BY_SYMBOL,
  ISOTOPES_BY_ELEMENT,
} from "./isotopes";
import { CURATED_INTERFERENCES } from "./curated-interferences";

// ── A) Abundance sum guard ────────────────────────────────────────────────────

describe("abundance sum guard", () => {
  for (const el of ELEMENTS) {
    it(`${el.symbol} isotope abundances sum to ~100% (±0.1%)`, () => {
      const isos = ISOTOPES_BY_ELEMENT[el.symbol];
      expect(isos, `No isotopes for ${el.symbol}`).toBeDefined();
      expect(isos.length).toBeGreaterThan(0);
      const sum = isos.reduce((acc, iso) => acc + iso.abundance, 0);
      expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
    });
  }
});

// ── B) Spot-check NIST values ────────────────────────────────────────────────
// Values cross-checked against NIST WebBook and Thomas (2013) Practical Guide to ICP-MS

describe("NIST spot-check values", () => {
  function iso(symbol: string, mass: number) {
    return ISOTOPES_BY_ELEMENT[symbol]?.find((i) => i.massNumber === mass);
  }

  // Hydrogen
  it("1H abundance = 99.9885%", () => {
    expect(iso("H", 1)?.abundance).toBeCloseTo(99.9885, 3);
  });

  // Argon — plasma gas, critical for interference calculations
  it("40Ar abundance = 99.6003%", () => {
    expect(iso("Ar", 40)?.abundance).toBeCloseTo(99.6003, 3);
  });
  it("36Ar abundance = 0.3365%", () => {
    expect(iso("Ar", 36)?.abundance).toBeCloseTo(0.3365, 3);
  });

  // Chlorine — key in HfCl4 test case
  it("35Cl abundance = 75.76%", () => {
    expect(iso("Cl", 35)?.abundance).toBeCloseTo(75.76, 1);
  });
  it("37Cl abundance = 24.24%", () => {
    expect(iso("Cl", 37)?.abundance).toBeCloseTo(24.24, 1);
  });

  // Hafnium — primary test-case element (HfCl4 substrate)
  it("178Hf abundance = 27.28%", () => {
    expect(iso("Hf", 178)?.abundance).toBeCloseTo(27.28, 1);
  });
  it("180Hf abundance = 35.08%", () => {
    expect(iso("Hf", 180)?.abundance).toBeCloseTo(35.08, 1);
  });
  it("Hf has 6 isotopes", () => {
    expect(ISOTOPES_BY_ELEMENT["Hf"].length).toBe(6);
  });

  // Arsenic — monoisotopic, key test case (75As, only isotope)
  it("75As abundance = 100.0% (monoisotopic)", () => {
    expect(iso("As", 75)?.abundance).toBeCloseTo(100.0, 1);
  });
  it("As has exactly 1 isotope", () => {
    expect(ISOTOPES_BY_ELEMENT["As"].length).toBe(1);
  });

  // Selenium — 80Se/40Ar2+ interference validation case
  it("80Se abundance = 49.61%", () => {
    expect(iso("Se", 80)?.abundance).toBeCloseTo(49.61, 1);
  });

  // Barium — M2+ test case: 138Ba2+→m/z 69, 137Ba2+→68.5 (excluded, non-integer)
  it("138Ba abundance = 71.698%", () => {
    expect(iso("Ba", 138)?.abundance).toBeCloseTo(71.698, 2);
  });
  it("137Ba abundance = 11.232%", () => {
    expect(iso("Ba", 137)?.abundance).toBeCloseTo(11.232, 2);
  });
  it("Ba has 7 isotopes", () => {
    expect(ISOTOPES_BY_ELEMENT["Ba"].length).toBe(7);
  });

  // Iron — 56Fe, major 40Ar16O+ interference target
  it("56Fe abundance = 91.754%", () => {
    expect(iso("Fe", 56)?.abundance).toBeCloseTo(91.754, 2);
  });

  // Oxygen — precursor for ArO+ interferences
  it("16O abundance = 99.757%", () => {
    expect(iso("O", 16)?.abundance).toBeCloseTo(99.757, 2);
  });

  // Nitrogen — precursor for N2+/ArN+ interferences
  it("14N abundance = 99.632%", () => {
    expect(iso("N", 14)?.abundance).toBeCloseTo(99.632, 2);
  });

  // Silicon — 28Si/14N2+ interference
  it("28Si abundance = 92.223%", () => {
    expect(iso("Si", 28)?.abundance).toBeCloseTo(92.223, 2);
  });

  // Sulfur — 32S/16O2+ interference
  it("32S abundance = 94.99%", () => {
    expect(iso("S", 32)?.abundance).toBeCloseTo(94.99, 1);
  });

  // Lead — M2+ curated element
  it("208Pb abundance = 52.4%", () => {
    expect(iso("Pb", 208)?.abundance).toBeCloseTo(52.4, 0);
  });

  // Uranium — primordial, 238U dominant
  it("238U abundance = 99.2742%", () => {
    expect(iso("U", 238)?.abundance).toBeCloseTo(99.2742, 3);
  });

  // Tin — most isotopes of any stable element (10)
  it("Sn has 10 isotopes", () => {
    expect(ISOTOPES_BY_ELEMENT["Sn"].length).toBe(10);
  });
  it("120Sn abundance = 32.58% (most abundant Sn isotope)", () => {
    expect(iso("Sn", 120)?.abundance).toBeCloseTo(32.58, 1);
  });
});

// ── C) icpmsMeasurable flags ──────────────────────────────────────────────────

describe("icpmsMeasurable flags", () => {
  const notMeasurable = ["H", "He", "C", "N", "O", "F", "Ne", "Cl", "Ar", "Br", "Kr", "I", "Xe"];
  for (const sym of notMeasurable) {
    it(`${sym} is icpmsMeasurable=false`, () => {
      expect(ELEMENT_BY_SYMBOL[sym]?.icpmsMeasurable).toBe(false);
    });
  }

  const measurable = ["Li", "Be", "Na", "Mg", "Al", "Si", "P", "S", "K", "Ca",
    "Fe", "Co", "Ni", "Cu", "Zn", "As", "Se", "Hf", "Ba", "Pb", "Bi", "Th", "U"];
  for (const sym of measurable) {
    it(`${sym} is icpmsMeasurable=true`, () => {
      expect(ELEMENT_BY_SYMBOL[sym]?.icpmsMeasurable).toBe(true);
    });
  }
});

// ── D) Lookup map integrity ───────────────────────────────────────────────────

describe("lookup map integrity", () => {
  it("ELEMENT_BY_SYMBOL covers all elements in ELEMENTS array", () => {
    for (const el of ELEMENTS) {
      expect(ELEMENT_BY_SYMBOL[el.symbol]).toBe(el);
    }
  });

  it("ISOTOPES_BY_ELEMENT covers all elements in ELEMENTS array", () => {
    for (const el of ELEMENTS) {
      expect(ISOTOPES_BY_ELEMENT[el.symbol]).toBeDefined();
      expect(ISOTOPES_BY_ELEMENT[el.symbol].length).toBeGreaterThan(0);
    }
  });

  it("ISOTOPES_BY_ELEMENT contains only elements defined in ELEMENTS", () => {
    for (const sym of Object.keys(ISOTOPES_BY_ELEMENT)) {
      expect(ELEMENT_BY_SYMBOL[sym], `Unknown element ${sym} in ISOTOPES_BY_ELEMENT`).toBeDefined();
    }
  });

  it("total isotope count is >= 280 (all stable/primordial isotopes Li–U)", () => {
    expect(ISOTOPES.length).toBeGreaterThanOrEqual(280);
  });

  it("all isotope massNumbers are positive integers", () => {
    for (const iso of ISOTOPES) {
      expect(Number.isInteger(iso.massNumber)).toBe(true);
      expect(iso.massNumber).toBeGreaterThan(0);
    }
  });

  it("all isotope abundances are in range (0, 100]", () => {
    for (const iso of ISOTOPES) {
      expect(iso.abundance).toBeGreaterThan(0);
      expect(iso.abundance).toBeLessThanOrEqual(100);
    }
  });

  it("all exactMass values are positive", () => {
    for (const iso of ISOTOPES) {
      expect(iso.exactMass).toBeGreaterThan(0);
    }
  });
});

// ── E) Curated interference integrity ────────────────────────────────────────

describe("curated interference integrity", () => {
  it("40Ar2+ targets m/z 80 with high severity", () => {
    const ar2 = CURATED_INTERFERENCES.find(
      (i) => i.composition === "⁴⁰Ar₂⁺" && i.targetMass === 80
    );
    expect(ar2, "40Ar2+ entry missing").toBeDefined();
    expect(ar2!.severity).toBe("high");
    expect(ar2!.precursorElements).toContain("Ar");
    expect(ar2!.precursorAbundanceProduct).toBeGreaterThanOrEqual(1.0);
  });

  it("14N2+ targets m/z 28 with high severity (28Si interference)", () => {
    const n2 = CURATED_INTERFERENCES.find(
      (i) => i.composition === "¹⁴N₂⁺" && i.targetMass === 28
    );
    expect(n2, "14N2+ entry missing").toBeDefined();
    expect(n2!.severity).toBe("high");
  });

  it("16O2+ targets m/z 32 with high severity (32S interference)", () => {
    const o2 = CURATED_INTERFERENCES.find(
      (i) => i.composition === "¹⁶O₂⁺" && i.targetMass === 32
    );
    expect(o2, "16O2+ entry missing").toBeDefined();
    expect(o2!.severity).toBe("high");
  });

  it("all curated interferences have integer targetMass", () => {
    for (const ci of CURATED_INTERFERENCES) {
      expect(Number.isInteger(ci.targetMass)).toBe(true);
    }
  });

  it("all curated interferences have source='curated'", () => {
    for (const ci of CURATED_INTERFERENCES) {
      expect(ci.source).toBe("curated");
    }
  });

  it("all curated severity values match precursorAbundanceProduct thresholds", () => {
    for (const ci of CURATED_INTERFERENCES) {
      if (ci.severity === "high") {
        expect(ci.precursorAbundanceProduct).toBeGreaterThanOrEqual(1.0);
      } else if (ci.severity === "medium") {
        expect(ci.precursorAbundanceProduct).toBeGreaterThanOrEqual(0.01);
        expect(ci.precursorAbundanceProduct).toBeLessThan(1.0);
      } else {
        expect(ci.precursorAbundanceProduct).toBeLessThan(0.01);
      }
    }
  });
});
