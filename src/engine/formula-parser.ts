/**
 * formula-parser.ts
 *
 * Parses a chemical formula string into an element → atom-count map.
 * Supports: nested parentheses, bracket groups, element symbols (1–2 letters),
 * and trailing/leading multipliers.
 *
 * Examples:
 *   "HfCl4"              → { Hf: 1, Cl: 4 }
 *   "SiH(N(CH3)2)3"      → { Si: 1, H: 1, N: 2, C: 6, H: 6 } → { Si:1, H:7, N:2, C:6 }
 *   "Fe2(SO4)3"          → { Fe: 2, S: 3, O: 12 }
 *
 * Pure function — no React/DOM/I-O dependencies.
 */

export type Composition = Record<string, number>;

export class FormulaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaParseError';
  }
}

/**
 * Parse a chemical formula string and return element symbol → atom count.
 * Throws FormulaParseError for malformed input.
 */
/** Hydrate / adduct separators: center dot, bullet, asterisk, period. */
const HYDRATE_SEP = /[·•*.]/;
/** Trailing ionic charge, e.g. "+", "-", "^2-", "³⁺". A magnitude digit only
 *  counts as charge when marked by a caret or written in superscript — so a bare
 *  trailing count like the "4" in "NH4+" (or "O2") is never eaten. */
const TRAILING_CHARGE = /(?:\^[0-9]*[+-]|[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]|[+-])$/;

export function parseFormula(formula: string): Composition {
  const trimmed = formula.trim();
  if (!trimmed) {
    throw new FormulaParseError('화학식을 입력해 주세요.');
  }

  // Strip a trailing ionic charge — it does not affect element composition.
  const noCharge = trimmed.replace(TRAILING_CHARGE, '').trim();
  if (!noCharge) {
    throw new FormulaParseError('인식된 원소가 없습니다. 화학식을 확인해 주세요.');
  }

  // Split hydrates / adducts (e.g. "CuSO4·5H2O") and sum each segment.
  const segments = noCharge
    .split(HYDRATE_SEP)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const result: Composition = {};
  for (const seg of segments) {
    // Optional leading integer coefficient, e.g. the "5" in "5H2O".
    const [coef, afterCoef] = readNumber(seg, 0);
    const multiplier = coef === 0 ? 1 : coef;
    const body = seg.slice(afterCoef);
    if (!body) {
      throw new FormulaParseError(`화학식 파싱 오류: 계수 뒤에 원소가 없습니다 ("${seg}").`);
    }
    const [comp, end] = parseGroup(body, 0);
    if (end !== body.length) {
      throw new FormulaParseError(
        `화학식 파싱 오류: "${body[end]}" 위치 ${end}에서 예상하지 못한 문자를 만났습니다.`
      );
    }
    mergeInto(result, comp, multiplier);
  }

  if (Object.keys(result).length === 0) {
    throw new FormulaParseError('인식된 원소가 없습니다. 화학식을 확인해 주세요.');
  }
  return result;
}

/**
 * Recursively parse a group (either the whole formula or a parenthesised block)
 * starting at position `pos`.  Returns [composition, nextPos].
 */
function parseGroup(formula: string, pos: number): [Composition, number] {
  const counts: Composition = {};

  while (pos < formula.length) {
    const ch = formula[pos];

    if (ch === '(' || ch === '[') {
      // Begin nested group
      const closing = ch === '(' ? ')' : ']';
      const [inner, afterClose] = parseGroup(formula, pos + 1);
      if (pos + 1 > formula.length || formula[afterClose - 1] !== closing) {
        throw new FormulaParseError(
          `화학식 파싱 오류: "${closing}" 닫는 괄호가 없습니다.`
        );
      }
      const [multiplier, afterMult] = readNumber(formula, afterClose);
      const mult = multiplier === 0 ? 1 : multiplier;
      mergeInto(counts, inner, mult);
      pos = afterMult;
    } else if (ch === ')' || ch === ']') {
      // End of this group — caller will consume the bracket
      return [counts, pos + 1];
    } else if (ch >= 'A' && ch <= 'Z') {
      // Element symbol: one uppercase letter optionally followed by one lowercase
      let sym = ch;
      pos++;
      while (pos < formula.length && formula[pos] >= 'a' && formula[pos] <= 'z') {
        sym += formula[pos];
        pos++;
      }
      const [n, afterN] = readNumber(formula, pos);
      const count = n === 0 ? 1 : n;
      counts[sym] = (counts[sym] ?? 0) + count;
      pos = afterN;
    } else if (ch >= '0' && ch <= '9') {
      // A bare leading number shouldn't appear here — but handle gracefully
      throw new FormulaParseError(
        `화학식 파싱 오류: 숫자 "${ch}"가 원소 기호 없이 나타났습니다 (위치 ${pos}).`
      );
    } else {
      throw new FormulaParseError(
        `화학식 파싱 오류: 알 수 없는 문자 "${ch}" (위치 ${pos}).`
      );
    }
  }

  return [counts, pos];
}

/** Read a decimal integer at `pos`.  Returns [number, nextPos]; number=0 means none read. */
function readNumber(formula: string, pos: number): [number, number] {
  let n = 0;
  let read = false;
  while (pos < formula.length && formula[pos] >= '0' && formula[pos] <= '9') {
    n = n * 10 + parseInt(formula[pos], 10);
    pos++;
    read = true;
  }
  return [read ? n : 0, pos];
}

/** Add all entries from `src` * `multiplier` into `target`. */
function mergeInto(target: Composition, src: Composition, multiplier: number): void {
  for (const [sym, n] of Object.entries(src)) {
    target[sym] = (target[sym] ?? 0) + n * multiplier;
  }
}
