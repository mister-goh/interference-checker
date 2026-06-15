const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest'

export class PubChemError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PubChemError'
  }
}

export interface PubChemCompound {
  cid: number
  molecularFormula: string
  title: string
  molecularWeight?: string
  iupacName?: string
}

/** AbortError can surface as DOMException or a plain Error depending on runtime. */
export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

// --- per-session in-memory caches (avoid repeat network for identical queries) ---
const autocompleteCache = new Map<string, string[]>()
const propsCache = new Map<string, PubChemCompound[]>()

/** Autocomplete compound names. Returns [] on any non-abort failure. */
export async function searchAutocomplete(query: string, signal?: AbortSignal): Promise<string[]> {
  const q = query.trim()
  if (!q) return []
  const cached = autocompleteCache.get(q.toLowerCase())
  if (cached) return cached
  try {
    const res = await fetch(
      `${BASE}/autocomplete/compound/${encodeURIComponent(q)}/JSON?limit=8`,
      { signal },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { dictionary_terms?: { compound?: string[] } }
    const names = data.dictionary_terms?.compound ?? []
    autocompleteCache.set(q.toLowerCase(), names)
    return names
  } catch (err) {
    if (isAbortError(err)) throw err
    return []
  }
}

/** Resolve any name/CAS namespace query to a list of CIDs. 404 → []. */
async function fetchCids(url: string, signal?: AbortSignal): Promise<number[]> {
  const res = await fetch(url, { signal })
  if (res.status === 404) return []
  if (!res.ok) {
    throw new PubChemError('PubChem 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const data = (await res.json()) as { IdentifierList?: { CID?: number[] } }
  return data.IdentifierList?.CID ?? []
}

export function fetchCidsByName(name: string, signal?: AbortSignal): Promise<number[]> {
  return fetchCids(`${BASE}/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`, signal)
}

// CAS registry numbers are indexed as PubChem synonyms → resolvable via the name namespace.
export function fetchCidsByCas(cas: string, signal?: AbortSignal): Promise<number[]> {
  return fetchCids(`${BASE}/pug/compound/name/${encodeURIComponent(cas)}/cids/JSON`, signal)
}

/** Fetch properties for up to 8 CIDs in a single batched call. */
export async function fetchPropsByCids(
  cids: number[],
  signal?: AbortSignal,
): Promise<PubChemCompound[]> {
  const top = cids.slice(0, 8)
  if (top.length === 0) return []
  const key = top.join(',')
  const cached = propsCache.get(key)
  if (cached) return cached
  const res = await fetch(
    `${BASE}/pug/compound/cid/${key}/property/MolecularFormula,MolecularWeight,Title,IUPACName/JSON`,
    { signal },
  )
  if (!res.ok) {
    throw new PubChemError('PubChem 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const data = (await res.json()) as {
    PropertyTable?: {
      Properties?: Array<{
        CID: number
        MolecularFormula?: string
        MolecularWeight?: string | number
        Title?: string
        IUPACName?: string
      }>
    }
  }
  const compounds: PubChemCompound[] = (data.PropertyTable?.Properties ?? [])
    .filter((p) => p.MolecularFormula)
    .map((p) => ({
      cid: p.CID,
      molecularFormula: p.MolecularFormula as string,
      title: p.Title ?? p.IUPACName ?? String(p.CID),
      molecularWeight: p.MolecularWeight != null ? String(p.MolecularWeight) : undefined,
      iupacName: p.IUPACName,
    }))
  propsCache.set(key, compounds)
  return compounds
}

/** Name → candidate compounds (1 or more). Throws PubChemError when nothing matches. */
export async function resolveByName(name: string, signal?: AbortSignal): Promise<PubChemCompound[]> {
  const cids = await fetchCidsByName(name, signal)
  if (cids.length === 0) {
    throw new PubChemError(`"${name}"에 해당하는 화합물을 찾을 수 없습니다.`)
  }
  const compounds = await fetchPropsByCids(cids, signal)
  if (compounds.length === 0) {
    throw new PubChemError('화합물 정보를 가져올 수 없습니다.')
  }
  return compounds
}

/** CAS number → candidate compounds. Throws PubChemError when nothing matches. */
export async function resolveByCas(cas: string, signal?: AbortSignal): Promise<PubChemCompound[]> {
  const cids = await fetchCidsByCas(cas, signal)
  if (cids.length === 0) {
    throw new PubChemError(`CAS 번호 "${cas}"에 해당하는 화합물을 찾을 수 없습니다.`)
  }
  const compounds = await fetchPropsByCids(cids, signal)
  if (compounds.length === 0) {
    throw new PubChemError('화합물 정보를 가져올 수 없습니다.')
  }
  return compounds
}

/** PubChem 2D structure depiction (PNG) — usable directly as an <img> src.
 *  Pass `large` for a higher-resolution depiction (e.g. zoomed-in view). */
export function structureImageUrl(cid: number, large = false): string {
  return `${BASE}/pug/compound/cid/${cid}/PNG${large ? '?image_size=large' : ''}`
}
