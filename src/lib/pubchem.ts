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
}

export async function searchAutocomplete(query: string): Promise<string[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(
      `${BASE}/autocomplete/compound/${encodeURIComponent(query.trim())}/JSON?limit=8`,
    )
    if (!res.ok) return []
    const data = await res.json() as { dictionary_terms?: { compound?: string[] } }
    return data.dictionary_terms?.compound ?? []
  } catch {
    return []
  }
}

export async function fetchByName(name: string): Promise<PubChemCompound> {
  const res = await fetch(
    `${BASE}/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,Title/JSON`,
  )
  if (res.status === 404) {
    throw new PubChemError(`"${name}"에 해당하는 화합물을 찾을 수 없습니다.`)
  }
  if (!res.ok) {
    throw new PubChemError('PubChem 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
  }
  const data = await res.json() as {
    PropertyTable?: {
      Properties?: Array<{ CID: number; MolecularFormula: string; Title?: string }>
    }
  }
  const prop = data.PropertyTable?.Properties?.[0]
  if (!prop) throw new PubChemError('화합물 정보를 가져올 수 없습니다.')
  return {
    cid: prop.CID,
    molecularFormula: prop.MolecularFormula,
    title: prop.Title ?? name,
  }
}
