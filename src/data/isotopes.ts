/**
 * src/data/isotopes.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Source: NIST Atomic Weights and Isotopic Compositions with Relative Atomic Masses
 * URL:    https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses
 * Access: 2026-06-10
 *
 * Regenerate: npx tsx .omc/data-staging/generate-isotopes.ts
 *
 * Notes:
 * - Abundance values are in percent (%). Stable and primordial isotopes only.
 * - exactMass in unified atomic mass units (u).
 * - icpmsMeasurable=false elements (H, C, N, O, F, noble gases, halogens) are
 *   included because they are interference PRECURSORS — the engine uses their
 *   isotopes to generate polyatomic interference species.
 */

import type { Element, Isotope } from "../types";

export const ELEMENTS: Element[] = [
  { symbol: "H",  name: "Hydrogen",     atomicNumber: 1,  icpmsMeasurable: false },
  { symbol: "He", name: "Helium",       atomicNumber: 2,  icpmsMeasurable: false },
  { symbol: "Li", name: "Lithium",      atomicNumber: 3,  icpmsMeasurable: true  },
  { symbol: "Be", name: "Beryllium",    atomicNumber: 4,  icpmsMeasurable: true  },
  { symbol: "B",  name: "Boron",        atomicNumber: 5,  icpmsMeasurable: true  },
  { symbol: "C",  name: "Carbon",       atomicNumber: 6,  icpmsMeasurable: false },
  { symbol: "N",  name: "Nitrogen",     atomicNumber: 7,  icpmsMeasurable: false },
  { symbol: "O",  name: "Oxygen",       atomicNumber: 8,  icpmsMeasurable: false },
  { symbol: "F",  name: "Fluorine",     atomicNumber: 9,  icpmsMeasurable: false },
  { symbol: "Ne", name: "Neon",         atomicNumber: 10, icpmsMeasurable: false },
  { symbol: "Na", name: "Sodium",       atomicNumber: 11, icpmsMeasurable: true  },
  { symbol: "Mg", name: "Magnesium",    atomicNumber: 12, icpmsMeasurable: true  },
  { symbol: "Al", name: "Aluminum",     atomicNumber: 13, icpmsMeasurable: true  },
  { symbol: "Si", name: "Silicon",      atomicNumber: 14, icpmsMeasurable: true  },
  { symbol: "P",  name: "Phosphorus",   atomicNumber: 15, icpmsMeasurable: true  },
  { symbol: "S",  name: "Sulfur",       atomicNumber: 16, icpmsMeasurable: true  },
  { symbol: "Cl", name: "Chlorine",     atomicNumber: 17, icpmsMeasurable: false },
  { symbol: "Ar", name: "Argon",        atomicNumber: 18, icpmsMeasurable: false },
  { symbol: "K",  name: "Potassium",    atomicNumber: 19, icpmsMeasurable: true  },
  { symbol: "Ca", name: "Calcium",      atomicNumber: 20, icpmsMeasurable: true  },
  { symbol: "Sc", name: "Scandium",     atomicNumber: 21, icpmsMeasurable: true  },
  { symbol: "Ti", name: "Titanium",     atomicNumber: 22, icpmsMeasurable: true  },
  { symbol: "V",  name: "Vanadium",     atomicNumber: 23, icpmsMeasurable: true  },
  { symbol: "Cr", name: "Chromium",     atomicNumber: 24, icpmsMeasurable: true  },
  { symbol: "Mn", name: "Manganese",    atomicNumber: 25, icpmsMeasurable: true  },
  { symbol: "Fe", name: "Iron",         atomicNumber: 26, icpmsMeasurable: true  },
  { symbol: "Co", name: "Cobalt",       atomicNumber: 27, icpmsMeasurable: true  },
  { symbol: "Ni", name: "Nickel",       atomicNumber: 28, icpmsMeasurable: true  },
  { symbol: "Cu", name: "Copper",       atomicNumber: 29, icpmsMeasurable: true  },
  { symbol: "Zn", name: "Zinc",         atomicNumber: 30, icpmsMeasurable: true  },
  { symbol: "Ga", name: "Gallium",      atomicNumber: 31, icpmsMeasurable: true  },
  { symbol: "Ge", name: "Germanium",    atomicNumber: 32, icpmsMeasurable: true  },
  { symbol: "As", name: "Arsenic",      atomicNumber: 33, icpmsMeasurable: true  },
  { symbol: "Se", name: "Selenium",     atomicNumber: 34, icpmsMeasurable: true  },
  { symbol: "Br", name: "Bromine",      atomicNumber: 35, icpmsMeasurable: false },
  { symbol: "Kr", name: "Krypton",      atomicNumber: 36, icpmsMeasurable: false },
  { symbol: "Rb", name: "Rubidium",     atomicNumber: 37, icpmsMeasurable: true  },
  { symbol: "Sr", name: "Strontium",    atomicNumber: 38, icpmsMeasurable: true  },
  { symbol: "Y",  name: "Yttrium",      atomicNumber: 39, icpmsMeasurable: true  },
  { symbol: "Zr", name: "Zirconium",    atomicNumber: 40, icpmsMeasurable: true  },
  { symbol: "Nb", name: "Niobium",      atomicNumber: 41, icpmsMeasurable: true  },
  { symbol: "Mo", name: "Molybdenum",   atomicNumber: 42, icpmsMeasurable: true  },
  { symbol: "Ru", name: "Ruthenium",    atomicNumber: 44, icpmsMeasurable: true  },
  { symbol: "Rh", name: "Rhodium",      atomicNumber: 45, icpmsMeasurable: true  },
  { symbol: "Pd", name: "Palladium",    atomicNumber: 46, icpmsMeasurable: true  },
  { symbol: "Ag", name: "Silver",       atomicNumber: 47, icpmsMeasurable: true  },
  { symbol: "Cd", name: "Cadmium",      atomicNumber: 48, icpmsMeasurable: true  },
  { symbol: "In", name: "Indium",       atomicNumber: 49, icpmsMeasurable: true  },
  { symbol: "Sn", name: "Tin",          atomicNumber: 50, icpmsMeasurable: true  },
  { symbol: "Sb", name: "Antimony",     atomicNumber: 51, icpmsMeasurable: true  },
  { symbol: "Te", name: "Tellurium",    atomicNumber: 52, icpmsMeasurable: true  },
  { symbol: "I",  name: "Iodine",       atomicNumber: 53, icpmsMeasurable: false },
  { symbol: "Xe", name: "Xenon",        atomicNumber: 54, icpmsMeasurable: false },
  { symbol: "Cs", name: "Cesium",       atomicNumber: 55, icpmsMeasurable: true  },
  { symbol: "Ba", name: "Barium",       atomicNumber: 56, icpmsMeasurable: true  },
  { symbol: "La", name: "Lanthanum",    atomicNumber: 57, icpmsMeasurable: true  },
  { symbol: "Ce", name: "Cerium",       atomicNumber: 58, icpmsMeasurable: true  },
  { symbol: "Pr", name: "Praseodymium", atomicNumber: 59, icpmsMeasurable: true  },
  { symbol: "Nd", name: "Neodymium",    atomicNumber: 60, icpmsMeasurable: true  },
  { symbol: "Sm", name: "Samarium",     atomicNumber: 62, icpmsMeasurable: true  },
  { symbol: "Eu", name: "Europium",     atomicNumber: 63, icpmsMeasurable: true  },
  { symbol: "Gd", name: "Gadolinium",   atomicNumber: 64, icpmsMeasurable: true  },
  { symbol: "Tb", name: "Terbium",      atomicNumber: 65, icpmsMeasurable: true  },
  { symbol: "Dy", name: "Dysprosium",   atomicNumber: 66, icpmsMeasurable: true  },
  { symbol: "Ho", name: "Holmium",      atomicNumber: 67, icpmsMeasurable: true  },
  { symbol: "Er", name: "Erbium",       atomicNumber: 68, icpmsMeasurable: true  },
  { symbol: "Tm", name: "Thulium",      atomicNumber: 69, icpmsMeasurable: true  },
  { symbol: "Yb", name: "Ytterbium",    atomicNumber: 70, icpmsMeasurable: true  },
  { symbol: "Lu", name: "Lutetium",     atomicNumber: 71, icpmsMeasurable: true  },
  { symbol: "Hf", name: "Hafnium",      atomicNumber: 72, icpmsMeasurable: true  },
  { symbol: "Ta", name: "Tantalum",     atomicNumber: 73, icpmsMeasurable: true  },
  { symbol: "W",  name: "Tungsten",     atomicNumber: 74, icpmsMeasurable: true  },
  { symbol: "Re", name: "Rhenium",      atomicNumber: 75, icpmsMeasurable: true  },
  { symbol: "Os", name: "Osmium",       atomicNumber: 76, icpmsMeasurable: true  },
  { symbol: "Ir", name: "Iridium",      atomicNumber: 77, icpmsMeasurable: true  },
  { symbol: "Pt", name: "Platinum",     atomicNumber: 78, icpmsMeasurable: true  },
  { symbol: "Au", name: "Gold",         atomicNumber: 79, icpmsMeasurable: true  },
  { symbol: "Hg", name: "Mercury",      atomicNumber: 80, icpmsMeasurable: true  },
  { symbol: "Tl", name: "Thallium",     atomicNumber: 81, icpmsMeasurable: true  },
  { symbol: "Pb", name: "Lead",         atomicNumber: 82, icpmsMeasurable: true  },
  { symbol: "Bi", name: "Bismuth",      atomicNumber: 83, icpmsMeasurable: true  },
  { symbol: "Th", name: "Thorium",      atomicNumber: 90, icpmsMeasurable: true  },
  { symbol: "U",  name: "Uranium",      atomicNumber: 92, icpmsMeasurable: true  },
];

export const ISOTOPES: Isotope[] = [
  // H — Hydrogen (icpmsMeasurable: false — precursor only)
  { elementSymbol: "H",  massNumber: 1,   exactMass: 1.00782503207,    abundance: 99.9885  },
  { elementSymbol: "H",  massNumber: 2,   exactMass: 2.01410177785,    abundance: 0.0115   },
  // He — Helium (icpmsMeasurable: false)
  { elementSymbol: "He", massNumber: 3,   exactMass: 3.0160293191,     abundance: 0.000134 },
  { elementSymbol: "He", massNumber: 4,   exactMass: 4.00260325415,    abundance: 99.999866},
  // Li — Lithium
  { elementSymbol: "Li", massNumber: 6,   exactMass: 6.015122795,      abundance: 7.59     },
  { elementSymbol: "Li", massNumber: 7,   exactMass: 7.01600455,       abundance: 92.41    },
  // Be — Beryllium (monoisotopic)
  { elementSymbol: "Be", massNumber: 9,   exactMass: 9.0121831,        abundance: 100.0    },
  // B — Boron
  { elementSymbol: "B",  massNumber: 10,  exactMass: 10.0129370,       abundance: 19.9     },
  { elementSymbol: "B",  massNumber: 11,  exactMass: 11.0093054,       abundance: 80.1     },
  // C — Carbon (icpmsMeasurable: false — precursor only)
  { elementSymbol: "C",  massNumber: 12,  exactMass: 12.0000000,       abundance: 98.93    },
  { elementSymbol: "C",  massNumber: 13,  exactMass: 13.00335484,      abundance: 1.07     },
  // N — Nitrogen (icpmsMeasurable: false — precursor only)
  { elementSymbol: "N",  massNumber: 14,  exactMass: 14.0030740052,    abundance: 99.632   },
  { elementSymbol: "N",  massNumber: 15,  exactMass: 15.0001088984,    abundance: 0.368    },
  // O — Oxygen (icpmsMeasurable: false — precursor only)
  { elementSymbol: "O",  massNumber: 16,  exactMass: 15.99491461957,   abundance: 99.757   },
  { elementSymbol: "O",  massNumber: 17,  exactMass: 16.99913170,      abundance: 0.038    },
  { elementSymbol: "O",  massNumber: 18,  exactMass: 17.9991610,       abundance: 0.205    },
  // F — Fluorine (icpmsMeasurable: false — monoisotopic)
  { elementSymbol: "F",  massNumber: 19,  exactMass: 18.99840322,      abundance: 100.0    },
  // Ne — Neon (icpmsMeasurable: false)
  { elementSymbol: "Ne", massNumber: 20,  exactMass: 19.9924401754,    abundance: 90.48    },
  { elementSymbol: "Ne", massNumber: 21,  exactMass: 20.9938853,       abundance: 0.27     },
  { elementSymbol: "Ne", massNumber: 22,  exactMass: 21.991385114,     abundance: 9.25     },
  // Na — Sodium (monoisotopic)
  { elementSymbol: "Na", massNumber: 23,  exactMass: 22.9897692809,    abundance: 100.0    },
  // Mg — Magnesium
  { elementSymbol: "Mg", massNumber: 24,  exactMass: 23.985041697,     abundance: 78.99    },
  { elementSymbol: "Mg", massNumber: 25,  exactMass: 24.98583692,      abundance: 10.00    },
  { elementSymbol: "Mg", massNumber: 26,  exactMass: 25.982592929,     abundance: 11.01    },
  // Al — Aluminum (monoisotopic)
  { elementSymbol: "Al", massNumber: 27,  exactMass: 26.98153863,      abundance: 100.0    },
  // Si — Silicon
  { elementSymbol: "Si", massNumber: 28,  exactMass: 27.9769265325,    abundance: 92.223   },
  { elementSymbol: "Si", massNumber: 29,  exactMass: 28.976494700,     abundance: 4.685    },
  { elementSymbol: "Si", massNumber: 30,  exactMass: 29.97377017,      abundance: 3.092    },
  // P — Phosphorus (monoisotopic)
  { elementSymbol: "P",  massNumber: 31,  exactMass: 30.97376163,      abundance: 100.0    },
  // S — Sulfur
  { elementSymbol: "S",  massNumber: 32,  exactMass: 31.97207100,      abundance: 94.99    },
  { elementSymbol: "S",  massNumber: 33,  exactMass: 32.97145876,      abundance: 0.75     },
  { elementSymbol: "S",  massNumber: 34,  exactMass: 33.96786690,      abundance: 4.25     },
  { elementSymbol: "S",  massNumber: 36,  exactMass: 35.96708076,      abundance: 0.01     },
  // Cl — Chlorine (icpmsMeasurable: false — precursor only)
  { elementSymbol: "Cl", massNumber: 35,  exactMass: 34.96885268,      abundance: 75.76    },
  { elementSymbol: "Cl", massNumber: 37,  exactMass: 36.96590259,      abundance: 24.24    },
  // Ar — Argon (icpmsMeasurable: false — plasma gas, always present)
  { elementSymbol: "Ar", massNumber: 36,  exactMass: 35.967545106,     abundance: 0.3365   },
  { elementSymbol: "Ar", massNumber: 38,  exactMass: 37.9627324,       abundance: 0.0632   },
  { elementSymbol: "Ar", massNumber: 40,  exactMass: 39.9623831225,    abundance: 99.6003  },
  // K — Potassium
  { elementSymbol: "K",  massNumber: 39,  exactMass: 38.96370668,      abundance: 93.2581  },
  { elementSymbol: "K",  massNumber: 40,  exactMass: 39.96399848,      abundance: 0.0117   },
  { elementSymbol: "K",  massNumber: 41,  exactMass: 40.96182576,      abundance: 6.7302   },
  // Ca — Calcium
  { elementSymbol: "Ca", massNumber: 40,  exactMass: 39.96259098,      abundance: 96.941   },
  { elementSymbol: "Ca", massNumber: 42,  exactMass: 41.95861801,      abundance: 0.647    },
  { elementSymbol: "Ca", massNumber: 43,  exactMass: 42.9587666,       abundance: 0.135    },
  { elementSymbol: "Ca", massNumber: 44,  exactMass: 43.9554818,       abundance: 2.086    },
  { elementSymbol: "Ca", massNumber: 46,  exactMass: 45.9536926,       abundance: 0.004    },
  { elementSymbol: "Ca", massNumber: 48,  exactMass: 47.952534,        abundance: 0.187    },
  // Sc — Scandium (monoisotopic)
  { elementSymbol: "Sc", massNumber: 45,  exactMass: 44.9559119,       abundance: 100.0    },
  // Ti — Titanium
  { elementSymbol: "Ti", massNumber: 46,  exactMass: 45.9526316,       abundance: 8.25     },
  { elementSymbol: "Ti", massNumber: 47,  exactMass: 46.9517631,       abundance: 7.44     },
  { elementSymbol: "Ti", massNumber: 48,  exactMass: 47.9479463,       abundance: 73.72    },
  { elementSymbol: "Ti", massNumber: 49,  exactMass: 48.9478700,       abundance: 5.41     },
  { elementSymbol: "Ti", massNumber: 50,  exactMass: 49.9447912,       abundance: 5.18     },
  // V — Vanadium
  { elementSymbol: "V",  massNumber: 50,  exactMass: 49.9471585,       abundance: 0.25     },
  { elementSymbol: "V",  massNumber: 51,  exactMass: 50.9439595,       abundance: 99.75    },
  // Cr — Chromium
  { elementSymbol: "Cr", massNumber: 50,  exactMass: 49.9460442,       abundance: 4.345    },
  { elementSymbol: "Cr", massNumber: 52,  exactMass: 51.9405075,       abundance: 83.789   },
  { elementSymbol: "Cr", massNumber: 53,  exactMass: 52.9406494,       abundance: 9.501    },
  { elementSymbol: "Cr", massNumber: 54,  exactMass: 53.9388804,       abundance: 2.365    },
  // Mn — Manganese (monoisotopic)
  { elementSymbol: "Mn", massNumber: 55,  exactMass: 54.9380451,       abundance: 100.0    },
  // Fe — Iron
  { elementSymbol: "Fe", massNumber: 54,  exactMass: 53.9396105,       abundance: 5.845    },
  { elementSymbol: "Fe", massNumber: 56,  exactMass: 55.9349375,       abundance: 91.754   },
  { elementSymbol: "Fe", massNumber: 57,  exactMass: 56.9353940,       abundance: 2.119    },
  { elementSymbol: "Fe", massNumber: 58,  exactMass: 57.9332756,       abundance: 0.282    },
  // Co — Cobalt (monoisotopic)
  { elementSymbol: "Co", massNumber: 59,  exactMass: 58.9331950,       abundance: 100.0    },
  // Ni — Nickel
  { elementSymbol: "Ni", massNumber: 58,  exactMass: 57.9353429,       abundance: 68.0769  },
  { elementSymbol: "Ni", massNumber: 60,  exactMass: 59.9307864,       abundance: 26.2231  },
  { elementSymbol: "Ni", massNumber: 61,  exactMass: 60.9310560,       abundance: 1.1399   },
  { elementSymbol: "Ni", massNumber: 62,  exactMass: 61.9283451,       abundance: 3.6345   },
  { elementSymbol: "Ni", massNumber: 64,  exactMass: 63.9279660,       abundance: 0.9256   },
  // Cu — Copper
  { elementSymbol: "Cu", massNumber: 63,  exactMass: 62.9295975,       abundance: 69.17    },
  { elementSymbol: "Cu", massNumber: 65,  exactMass: 64.9277895,       abundance: 30.83    },
  // Zn — Zinc
  { elementSymbol: "Zn", massNumber: 64,  exactMass: 63.9291422,       abundance: 48.6     },
  { elementSymbol: "Zn", massNumber: 66,  exactMass: 65.9260334,       abundance: 27.9     },
  { elementSymbol: "Zn", massNumber: 67,  exactMass: 66.9271273,       abundance: 4.1      },
  { elementSymbol: "Zn", massNumber: 68,  exactMass: 67.9248442,       abundance: 18.8     },
  { elementSymbol: "Zn", massNumber: 70,  exactMass: 69.9253193,       abundance: 0.6      },
  // Ga — Gallium
  { elementSymbol: "Ga", massNumber: 69,  exactMass: 68.9255735,       abundance: 60.108   },
  { elementSymbol: "Ga", massNumber: 71,  exactMass: 70.9247013,       abundance: 39.892   },
  // Ge — Germanium
  { elementSymbol: "Ge", massNumber: 70,  exactMass: 69.9242474,       abundance: 20.57    },
  { elementSymbol: "Ge", massNumber: 72,  exactMass: 71.9220758,       abundance: 27.45    },
  { elementSymbol: "Ge", massNumber: 73,  exactMass: 72.9234589,       abundance: 7.75     },
  { elementSymbol: "Ge", massNumber: 74,  exactMass: 73.9211778,       abundance: 36.50    },
  { elementSymbol: "Ge", massNumber: 76,  exactMass: 75.9214026,       abundance: 7.73     },
  // As — Arsenic (monoisotopic — key validation case)
  { elementSymbol: "As", massNumber: 75,  exactMass: 74.9215965,       abundance: 100.0    },
  // Se — Selenium
  { elementSymbol: "Se", massNumber: 74,  exactMass: 73.9224764,       abundance: 0.89     },
  { elementSymbol: "Se", massNumber: 76,  exactMass: 75.9192136,       abundance: 9.37     },
  { elementSymbol: "Se", massNumber: 77,  exactMass: 76.9199140,       abundance: 7.63     },
  { elementSymbol: "Se", massNumber: 78,  exactMass: 77.9173091,       abundance: 23.77    },
  { elementSymbol: "Se", massNumber: 80,  exactMass: 79.9165218,       abundance: 49.61    },
  { elementSymbol: "Se", massNumber: 82,  exactMass: 81.9166995,       abundance: 8.73     },
  // Br — Bromine (icpmsMeasurable: false — precursor only)
  { elementSymbol: "Br", massNumber: 79,  exactMass: 78.9183371,       abundance: 50.69    },
  { elementSymbol: "Br", massNumber: 81,  exactMass: 80.9162897,       abundance: 49.31    },
  // Kr — Krypton (icpmsMeasurable: false)
  { elementSymbol: "Kr", massNumber: 78,  exactMass: 77.9203648,       abundance: 0.355    },
  { elementSymbol: "Kr", massNumber: 80,  exactMass: 79.9163790,       abundance: 2.286    },
  { elementSymbol: "Kr", massNumber: 82,  exactMass: 81.9134836,       abundance: 11.593   },
  { elementSymbol: "Kr", massNumber: 83,  exactMass: 82.914136,        abundance: 11.500   },
  { elementSymbol: "Kr", massNumber: 84,  exactMass: 83.911507,        abundance: 56.987   },
  { elementSymbol: "Kr", massNumber: 86,  exactMass: 85.9106103,       abundance: 17.279   },
  // Rb — Rubidium
  { elementSymbol: "Rb", massNumber: 85,  exactMass: 84.9117897379,    abundance: 72.17    },
  { elementSymbol: "Rb", massNumber: 87,  exactMass: 86.9091805310,    abundance: 27.83    },
  // Sr — Strontium (M2+ curated element)
  { elementSymbol: "Sr", massNumber: 84,  exactMass: 83.9134191,       abundance: 0.56     },
  { elementSymbol: "Sr", massNumber: 86,  exactMass: 85.9092606,       abundance: 9.86     },
  { elementSymbol: "Sr", massNumber: 87,  exactMass: 86.9088775,       abundance: 7.00     },
  { elementSymbol: "Sr", massNumber: 88,  exactMass: 87.9056125,       abundance: 82.58    },
  // Y — Yttrium (monoisotopic)
  { elementSymbol: "Y",  massNumber: 89,  exactMass: 88.9058403,       abundance: 100.0    },
  // Zr — Zirconium
  { elementSymbol: "Zr", massNumber: 90,  exactMass: 89.9047044,       abundance: 51.45    },
  { elementSymbol: "Zr", massNumber: 91,  exactMass: 90.9056458,       abundance: 11.22    },
  { elementSymbol: "Zr", massNumber: 92,  exactMass: 91.9050408,       abundance: 17.15    },
  { elementSymbol: "Zr", massNumber: 94,  exactMass: 93.9063152,       abundance: 17.38    },
  { elementSymbol: "Zr", massNumber: 96,  exactMass: 95.9082734,       abundance: 2.80     },
  // Nb — Niobium (monoisotopic)
  { elementSymbol: "Nb", massNumber: 93,  exactMass: 92.9063781,       abundance: 100.0    },
  // Mo — Molybdenum
  { elementSymbol: "Mo", massNumber: 92,  exactMass: 91.9068,          abundance: 14.53    },
  { elementSymbol: "Mo", massNumber: 94,  exactMass: 93.9051,          abundance: 9.15     },
  { elementSymbol: "Mo", massNumber: 95,  exactMass: 94.9058,          abundance: 15.84    },
  { elementSymbol: "Mo", massNumber: 96,  exactMass: 95.9047,          abundance: 16.67    },
  { elementSymbol: "Mo", massNumber: 97,  exactMass: 96.9060,          abundance: 9.60     },
  { elementSymbol: "Mo", massNumber: 98,  exactMass: 97.9054,          abundance: 24.39    },
  { elementSymbol: "Mo", massNumber: 100, exactMass: 99.9075,          abundance: 9.82     },
  // Ru — Ruthenium
  { elementSymbol: "Ru", massNumber: 96,  exactMass: 95.9076,          abundance: 5.54     },
  { elementSymbol: "Ru", massNumber: 98,  exactMass: 97.9053,          abundance: 1.87     },
  { elementSymbol: "Ru", massNumber: 99,  exactMass: 98.9059,          abundance: 12.76    },
  { elementSymbol: "Ru", massNumber: 100, exactMass: 99.9042,          abundance: 12.60    },
  { elementSymbol: "Ru", massNumber: 101, exactMass: 100.9056,         abundance: 17.06    },
  { elementSymbol: "Ru", massNumber: 102, exactMass: 101.9044,         abundance: 31.55    },
  { elementSymbol: "Ru", massNumber: 104, exactMass: 103.9054,         abundance: 18.62    },
  // Rh — Rhodium (monoisotopic)
  { elementSymbol: "Rh", massNumber: 103, exactMass: 102.9055,         abundance: 100.0    },
  // Pd — Palladium
  { elementSymbol: "Pd", massNumber: 102, exactMass: 101.9056,         abundance: 1.02     },
  { elementSymbol: "Pd", massNumber: 104, exactMass: 103.9040,         abundance: 11.14    },
  { elementSymbol: "Pd", massNumber: 105, exactMass: 104.9051,         abundance: 22.33    },
  { elementSymbol: "Pd", massNumber: 106, exactMass: 105.9035,         abundance: 27.33    },
  { elementSymbol: "Pd", massNumber: 108, exactMass: 107.9039,         abundance: 26.46    },
  { elementSymbol: "Pd", massNumber: 110, exactMass: 109.9052,         abundance: 11.72    },
  // Ag — Silver
  { elementSymbol: "Ag", massNumber: 107, exactMass: 106.9051,         abundance: 51.839   },
  { elementSymbol: "Ag", massNumber: 109, exactMass: 108.9048,         abundance: 48.161   },
  // Cd — Cadmium
  { elementSymbol: "Cd", massNumber: 106, exactMass: 105.9065,         abundance: 1.25     },
  { elementSymbol: "Cd", massNumber: 108, exactMass: 107.9042,         abundance: 0.89     },
  { elementSymbol: "Cd", massNumber: 110, exactMass: 109.9030,         abundance: 12.49    },
  { elementSymbol: "Cd", massNumber: 111, exactMass: 110.9042,         abundance: 12.80    },
  { elementSymbol: "Cd", massNumber: 112, exactMass: 111.9028,         abundance: 24.13    },
  { elementSymbol: "Cd", massNumber: 113, exactMass: 112.9044,         abundance: 12.22    },
  { elementSymbol: "Cd", massNumber: 114, exactMass: 113.9034,         abundance: 28.73    },
  { elementSymbol: "Cd", massNumber: 116, exactMass: 115.9048,         abundance: 7.49     },
  // In — Indium
  { elementSymbol: "In", massNumber: 113, exactMass: 112.9041,         abundance: 4.29     },
  { elementSymbol: "In", massNumber: 115, exactMass: 114.9039,         abundance: 95.71    },
  // Sn — Tin (10 isotopes, most of any stable element)
  { elementSymbol: "Sn", massNumber: 112, exactMass: 111.9048,         abundance: 0.97     },
  { elementSymbol: "Sn", massNumber: 114, exactMass: 113.9028,         abundance: 0.66     },
  { elementSymbol: "Sn", massNumber: 115, exactMass: 114.9033,         abundance: 0.34     },
  { elementSymbol: "Sn", massNumber: 116, exactMass: 115.9017,         abundance: 14.54    },
  { elementSymbol: "Sn", massNumber: 117, exactMass: 116.9030,         abundance: 7.68     },
  { elementSymbol: "Sn", massNumber: 118, exactMass: 117.9016,         abundance: 24.22    },
  { elementSymbol: "Sn", massNumber: 119, exactMass: 118.9033,         abundance: 8.59     },
  { elementSymbol: "Sn", massNumber: 120, exactMass: 119.9022,         abundance: 32.58    },
  { elementSymbol: "Sn", massNumber: 122, exactMass: 121.9034,         abundance: 4.63     },
  { elementSymbol: "Sn", massNumber: 124, exactMass: 123.9053,         abundance: 5.79     },
  // Sb — Antimony
  { elementSymbol: "Sb", massNumber: 121, exactMass: 120.9038,         abundance: 57.21    },
  { elementSymbol: "Sb", massNumber: 123, exactMass: 122.9042,         abundance: 42.79    },
  // Te — Tellurium
  { elementSymbol: "Te", massNumber: 120, exactMass: 119.9040,         abundance: 0.09     },
  { elementSymbol: "Te", massNumber: 122, exactMass: 121.9030,         abundance: 2.55     },
  { elementSymbol: "Te", massNumber: 123, exactMass: 122.9043,         abundance: 0.89     },
  { elementSymbol: "Te", massNumber: 124, exactMass: 123.9028,         abundance: 4.74     },
  { elementSymbol: "Te", massNumber: 125, exactMass: 124.9044,         abundance: 7.07     },
  { elementSymbol: "Te", massNumber: 126, exactMass: 125.9033,         abundance: 18.84    },
  { elementSymbol: "Te", massNumber: 128, exactMass: 127.9045,         abundance: 31.74    },
  { elementSymbol: "Te", massNumber: 130, exactMass: 129.9062,         abundance: 34.08    },
  // I — Iodine (icpmsMeasurable: false — monoisotopic halogen)
  { elementSymbol: "I",  massNumber: 127, exactMass: 126.9045,         abundance: 100.0    },
  // Xe — Xenon (icpmsMeasurable: false)
  { elementSymbol: "Xe", massNumber: 124, exactMass: 123.9059,         abundance: 0.0952   },
  { elementSymbol: "Xe", massNumber: 126, exactMass: 125.9043,         abundance: 0.0890   },
  { elementSymbol: "Xe", massNumber: 128, exactMass: 127.9035,         abundance: 1.9102   },
  { elementSymbol: "Xe", massNumber: 129, exactMass: 128.9048,         abundance: 26.4006  },
  { elementSymbol: "Xe", massNumber: 130, exactMass: 129.9035,         abundance: 4.0710   },
  { elementSymbol: "Xe", massNumber: 131, exactMass: 130.9051,         abundance: 21.2324  },
  { elementSymbol: "Xe", massNumber: 132, exactMass: 131.9042,         abundance: 26.9086  },
  { elementSymbol: "Xe", massNumber: 134, exactMass: 133.9054,         abundance: 10.4357  },
  { elementSymbol: "Xe", massNumber: 136, exactMass: 135.9072,         abundance: 8.8573   },
  // Cs — Cesium (monoisotopic)
  { elementSymbol: "Cs", massNumber: 133, exactMass: 132.9054520,      abundance: 100.0    },
  // Ba — Barium (M2+ curated element — key validation: 138Ba2+→69, 137Ba2+→68.5 excluded)
  { elementSymbol: "Ba", massNumber: 130, exactMass: 129.9063,         abundance: 0.106    },
  { elementSymbol: "Ba", massNumber: 132, exactMass: 131.9051,         abundance: 0.101    },
  { elementSymbol: "Ba", massNumber: 134, exactMass: 133.9045,         abundance: 2.417    },
  { elementSymbol: "Ba", massNumber: 135, exactMass: 134.9057,         abundance: 6.592    },
  { elementSymbol: "Ba", massNumber: 136, exactMass: 135.9046,         abundance: 7.854    },
  { elementSymbol: "Ba", massNumber: 137, exactMass: 136.9058,         abundance: 11.232   },
  { elementSymbol: "Ba", massNumber: 138, exactMass: 137.9052,         abundance: 71.698   },
  // La — Lanthanum (REE)
  { elementSymbol: "La", massNumber: 138, exactMass: 137.9071,         abundance: 0.08881  },
  { elementSymbol: "La", massNumber: 139, exactMass: 138.9064,         abundance: 99.91119 },
  // Ce — Cerium (REE)
  { elementSymbol: "Ce", massNumber: 136, exactMass: 135.9072,         abundance: 0.185    },
  { elementSymbol: "Ce", massNumber: 138, exactMass: 137.9060,         abundance: 0.251    },
  { elementSymbol: "Ce", massNumber: 140, exactMass: 139.9054,         abundance: 88.450   },
  { elementSymbol: "Ce", massNumber: 142, exactMass: 141.9092,         abundance: 11.114   },
  // Pr — Praseodymium (REE, monoisotopic)
  { elementSymbol: "Pr", massNumber: 141, exactMass: 140.9077,         abundance: 100.0    },
  // Nd — Neodymium (REE)
  { elementSymbol: "Nd", massNumber: 142, exactMass: 141.9077,         abundance: 27.2     },
  { elementSymbol: "Nd", massNumber: 143, exactMass: 142.9098,         abundance: 12.2     },
  { elementSymbol: "Nd", massNumber: 144, exactMass: 143.9101,         abundance: 23.8     },
  { elementSymbol: "Nd", massNumber: 145, exactMass: 144.9126,         abundance: 8.3      },
  { elementSymbol: "Nd", massNumber: 146, exactMass: 145.9131,         abundance: 17.2     },
  { elementSymbol: "Nd", massNumber: 148, exactMass: 147.9169,         abundance: 5.7      },
  { elementSymbol: "Nd", massNumber: 150, exactMass: 149.9209,         abundance: 5.6      },
  // Sm — Samarium (REE)
  { elementSymbol: "Sm", massNumber: 144, exactMass: 143.9120,         abundance: 3.07     },
  { elementSymbol: "Sm", massNumber: 147, exactMass: 146.9149,         abundance: 14.99    },
  { elementSymbol: "Sm", massNumber: 148, exactMass: 147.9148,         abundance: 11.24    },
  { elementSymbol: "Sm", massNumber: 149, exactMass: 148.9172,         abundance: 13.82    },
  { elementSymbol: "Sm", massNumber: 150, exactMass: 149.9173,         abundance: 7.38     },
  { elementSymbol: "Sm", massNumber: 152, exactMass: 151.9197,         abundance: 26.75    },
  { elementSymbol: "Sm", massNumber: 154, exactMass: 153.9222,         abundance: 22.75    },
  // Eu — Europium (REE, M2+ curated)
  { elementSymbol: "Eu", massNumber: 151, exactMass: 150.9198,         abundance: 47.81    },
  { elementSymbol: "Eu", massNumber: 153, exactMass: 152.9212,         abundance: 52.19    },
  // Gd — Gadolinium (REE)
  { elementSymbol: "Gd", massNumber: 152, exactMass: 151.9198,         abundance: 0.20     },
  { elementSymbol: "Gd", massNumber: 154, exactMass: 153.9209,         abundance: 2.18     },
  { elementSymbol: "Gd", massNumber: 155, exactMass: 154.9226,         abundance: 14.80    },
  { elementSymbol: "Gd", massNumber: 156, exactMass: 155.9221,         abundance: 20.47    },
  { elementSymbol: "Gd", massNumber: 157, exactMass: 156.9240,         abundance: 15.65    },
  { elementSymbol: "Gd", massNumber: 158, exactMass: 157.9241,         abundance: 24.84    },
  { elementSymbol: "Gd", massNumber: 160, exactMass: 159.9271,         abundance: 21.86    },
  // Tb — Terbium (REE, monoisotopic)
  { elementSymbol: "Tb", massNumber: 159, exactMass: 158.9254,         abundance: 100.0    },
  // Dy — Dysprosium (REE)
  { elementSymbol: "Dy", massNumber: 156, exactMass: 155.9243,         abundance: 0.056    },
  { elementSymbol: "Dy", massNumber: 158, exactMass: 157.9244,         abundance: 0.095    },
  { elementSymbol: "Dy", massNumber: 160, exactMass: 159.9252,         abundance: 2.329    },
  { elementSymbol: "Dy", massNumber: 161, exactMass: 160.9269,         abundance: 18.889   },
  { elementSymbol: "Dy", massNumber: 162, exactMass: 161.9268,         abundance: 25.475   },
  { elementSymbol: "Dy", massNumber: 163, exactMass: 162.9287,         abundance: 24.896   },
  { elementSymbol: "Dy", massNumber: 164, exactMass: 163.9292,         abundance: 28.260   },
  // Ho — Holmium (REE, monoisotopic)
  { elementSymbol: "Ho", massNumber: 165, exactMass: 164.9303,         abundance: 100.0    },
  // Er — Erbium (REE)
  { elementSymbol: "Er", massNumber: 162, exactMass: 161.9288,         abundance: 0.139    },
  { elementSymbol: "Er", massNumber: 164, exactMass: 163.9292,         abundance: 1.601    },
  { elementSymbol: "Er", massNumber: 166, exactMass: 165.9303,         abundance: 33.503   },
  { elementSymbol: "Er", massNumber: 167, exactMass: 166.9321,         abundance: 22.869   },
  { elementSymbol: "Er", massNumber: 168, exactMass: 167.9324,         abundance: 26.978   },
  { elementSymbol: "Er", massNumber: 170, exactMass: 169.9355,         abundance: 14.910   },
  // Tm — Thulium (REE, monoisotopic)
  { elementSymbol: "Tm", massNumber: 169, exactMass: 168.9342,         abundance: 100.0    },
  // Yb — Ytterbium (REE)
  { elementSymbol: "Yb", massNumber: 168, exactMass: 167.9339,         abundance: 0.13     },
  { elementSymbol: "Yb", massNumber: 170, exactMass: 169.9348,         abundance: 3.04     },
  { elementSymbol: "Yb", massNumber: 171, exactMass: 170.9363,         abundance: 14.28    },
  { elementSymbol: "Yb", massNumber: 172, exactMass: 171.9364,         abundance: 21.83    },
  { elementSymbol: "Yb", massNumber: 173, exactMass: 172.9382,         abundance: 16.13    },
  { elementSymbol: "Yb", massNumber: 174, exactMass: 173.9389,         abundance: 31.83    },
  { elementSymbol: "Yb", massNumber: 176, exactMass: 175.9426,         abundance: 12.76    },
  // Lu — Lutetium (REE)
  { elementSymbol: "Lu", massNumber: 175, exactMass: 174.9408,         abundance: 97.401   },
  { elementSymbol: "Lu", massNumber: 176, exactMass: 175.9427,         abundance: 2.599    },
  // Hf — Hafnium (key validation element for HfCl4 test case)
  { elementSymbol: "Hf", massNumber: 174, exactMass: 173.9400,         abundance: 0.16     },
  { elementSymbol: "Hf", massNumber: 176, exactMass: 175.9414,         abundance: 5.26     },
  { elementSymbol: "Hf", massNumber: 177, exactMass: 176.9432,         abundance: 18.60    },
  { elementSymbol: "Hf", massNumber: 178, exactMass: 177.9437,         abundance: 27.28    },
  { elementSymbol: "Hf", massNumber: 179, exactMass: 178.9458,         abundance: 13.62    },
  { elementSymbol: "Hf", massNumber: 180, exactMass: 179.9465,         abundance: 35.08    },
  // Ta — Tantalum
  { elementSymbol: "Ta", massNumber: 180, exactMass: 179.9475,         abundance: 0.01201  },
  { elementSymbol: "Ta", massNumber: 181, exactMass: 180.9480,         abundance: 99.98799 },
  // W — Tungsten
  { elementSymbol: "W",  massNumber: 180, exactMass: 179.9467,         abundance: 0.12     },
  { elementSymbol: "W",  massNumber: 182, exactMass: 181.9482,         abundance: 26.50    },
  { elementSymbol: "W",  massNumber: 183, exactMass: 182.9502,         abundance: 14.31    },
  { elementSymbol: "W",  massNumber: 184, exactMass: 183.9509,         abundance: 30.64    },
  { elementSymbol: "W",  massNumber: 186, exactMass: 185.9544,         abundance: 28.43    },
  // Re — Rhenium
  { elementSymbol: "Re", massNumber: 185, exactMass: 184.9530,         abundance: 37.40    },
  { elementSymbol: "Re", massNumber: 187, exactMass: 186.9558,         abundance: 62.60    },
  // Os — Osmium
  { elementSymbol: "Os", massNumber: 184, exactMass: 183.9524,         abundance: 0.02     },
  { elementSymbol: "Os", massNumber: 186, exactMass: 185.9538,         abundance: 1.59     },
  { elementSymbol: "Os", massNumber: 187, exactMass: 186.9558,         abundance: 1.96     },
  { elementSymbol: "Os", massNumber: 188, exactMass: 187.9559,         abundance: 13.24    },
  { elementSymbol: "Os", massNumber: 189, exactMass: 188.9582,         abundance: 16.15    },
  { elementSymbol: "Os", massNumber: 190, exactMass: 189.9584,         abundance: 26.26    },
  { elementSymbol: "Os", massNumber: 192, exactMass: 191.9615,         abundance: 40.78    },
  // Ir — Iridium
  { elementSymbol: "Ir", massNumber: 191, exactMass: 190.9606,         abundance: 37.3     },
  { elementSymbol: "Ir", massNumber: 193, exactMass: 192.9629,         abundance: 62.7     },
  // Pt — Platinum
  { elementSymbol: "Pt", massNumber: 190, exactMass: 189.9599,         abundance: 0.014    },
  { elementSymbol: "Pt", massNumber: 192, exactMass: 191.9610,         abundance: 0.782    },
  { elementSymbol: "Pt", massNumber: 194, exactMass: 193.9627,         abundance: 32.967   },
  { elementSymbol: "Pt", massNumber: 195, exactMass: 194.9648,         abundance: 33.832   },
  { elementSymbol: "Pt", massNumber: 196, exactMass: 195.9650,         abundance: 25.242   },
  { elementSymbol: "Pt", massNumber: 198, exactMass: 197.9679,         abundance: 7.163    },
  // Au — Gold (monoisotopic)
  { elementSymbol: "Au", massNumber: 197, exactMass: 196.9666,         abundance: 100.0    },
  // Hg — Mercury
  { elementSymbol: "Hg", massNumber: 196, exactMass: 195.9658,         abundance: 0.15     },
  { elementSymbol: "Hg", massNumber: 198, exactMass: 197.9668,         abundance: 9.97     },
  { elementSymbol: "Hg", massNumber: 199, exactMass: 198.9683,         abundance: 16.87    },
  { elementSymbol: "Hg", massNumber: 200, exactMass: 199.9683,         abundance: 23.10    },
  { elementSymbol: "Hg", massNumber: 201, exactMass: 200.9703,         abundance: 13.18    },
  { elementSymbol: "Hg", massNumber: 202, exactMass: 201.9706,         abundance: 29.86    },
  { elementSymbol: "Hg", massNumber: 204, exactMass: 203.9735,         abundance: 6.87     },
  // Tl — Thallium
  { elementSymbol: "Tl", massNumber: 203, exactMass: 202.9723,         abundance: 29.52    },
  { elementSymbol: "Tl", massNumber: 205, exactMass: 204.9744,         abundance: 70.48    },
  // Pb — Lead (M2+ curated element)
  { elementSymbol: "Pb", massNumber: 204, exactMass: 203.9730,         abundance: 1.4      },
  { elementSymbol: "Pb", massNumber: 206, exactMass: 205.9745,         abundance: 24.1     },
  { elementSymbol: "Pb", massNumber: 207, exactMass: 206.9759,         abundance: 22.1     },
  { elementSymbol: "Pb", massNumber: 208, exactMass: 207.9767,         abundance: 52.4     },
  // Bi — Bismuth (monoisotopic)
  { elementSymbol: "Bi", massNumber: 209, exactMass: 208.9804,         abundance: 100.0    },
  // Th — Thorium (primordial, monoisotopic in practice)
  { elementSymbol: "Th", massNumber: 232, exactMass: 232.0381,         abundance: 100.0    },
  // U — Uranium (primordial)
  { elementSymbol: "U",  massNumber: 234, exactMass: 234.0409,         abundance: 0.0054   },
  { elementSymbol: "U",  massNumber: 235, exactMass: 235.0439,         abundance: 0.7204   },
  { elementSymbol: "U",  massNumber: 238, exactMass: 238.0508,         abundance: 99.2742  },
];

/** Lookup map: symbol → Element */
export const ELEMENT_BY_SYMBOL: Record<string, Element> = Object.fromEntries(
  ELEMENTS.map((el) => [el.symbol, el])
);

/** Lookup map: symbol → Isotope[] (sorted by massNumber ascending) */
export const ISOTOPES_BY_ELEMENT: Record<string, Isotope[]> = {};
for (const iso of ISOTOPES) {
  (ISOTOPES_BY_ELEMENT[iso.elementSymbol] ??= []).push(iso);
}
