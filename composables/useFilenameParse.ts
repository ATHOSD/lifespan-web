export interface ParsedMeta {
  modality?: string
  sex?: 'M' | 'F'
  ageType?: 'GA' | 'Postnatal'
  ageValue?: number
  ageUnit?: 'weeks' | 'months' | 'years'
}

const MODALITY_PATTERNS: [string, RegExp][] = [
  ['T1w',   /^T1w$/i],
  ['T2w',   /^T2w$/i],
  ['FLAIR', /^FLAIR$/i],
  ['DWI',   /^DWI$/i],
  ['FA',    /^FA$/i],
  ['MD',    /^MD$/i],
  ['T1',    /^T1$/i],
  ['T2',    /^T2$/i],
]

export function parseFilename(filename: string): ParsedMeta {
  // Strip extensions (.nii.gz, .nii, etc.)
  const base = filename.replace(/(?:\.[a-zA-Z0-9]+)+$/, '')
  // Tokenize: split on any non-alphanumeric char
  const tokens = base.split(/[^A-Za-z0-9]+/).filter(Boolean)
  const result: ParsedMeta = {}

  // Modality: exact token match, specific patterns first
  outer: for (const tok of tokens) {
    for (const [label, re] of MODALITY_PATTERNS) {
      if (re.test(tok)) { result.modality = label; break outer }
    }
  }

  // Age: single-token patterns
  for (const tok of tokens) {
    let m: RegExpMatchArray | null
    // GA: 28w, 28wGA, 28wk, 28GA
    if ((m = tok.match(/^(\d+(?:\.\d+)?)(?:w(?:GA|wk)?|GA)$/i))) {
      result.ageType = 'GA'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'; break
    }
    // GA: GA28, GA28wk, GA28w
    if ((m = tok.match(/^GA(\d+(?:\.\d+)?)(?:w(?:k)?)?$/i))) {
      result.ageType = 'GA'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'; break
    }
    // Postnatal years: 5y, 5yr, 5.5years
    if ((m = tok.match(/^(\d+(?:\.\d+)?)y(?:r|rs|ears?)?$/i))) {
      result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'years'; break
    }
    // Postnatal months: 6mo, 6mon, 6months — require at least "mo" to avoid "m" alone
    if ((m = tok.match(/^(\d+(?:\.\d+)?)mo(?:n(?:th)?s?)?$/i))) {
      result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'months'; break
    }
  }

  // Age: "age" keyword + next token (BIDS-style: age-28w, age-5y)
  if (result.ageValue === undefined) {
    for (let i = 0; i < tokens.length - 1; i++) {
      if (!/^age$/i.test(tokens[i])) continue
      const next = tokens[i + 1]
      let m: RegExpMatchArray | null
      if ((m = next.match(/^(\d+(?:\.\d+)?)(?:w(?:GA|wk)?|GA)$/i)) || (m = next.match(/^GA(\d+(?:\.\d+)?)(?:w(?:k)?)?$/i))) {
        result.ageType = 'GA'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'
      } else if ((m = next.match(/^(\d+(?:\.\d+)?)y(?:r|rs?)?$/i))) {
        result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'years'
      } else if ((m = next.match(/^(\d+(?:\.\d+)?)mo(?:n(?:th)?s?)?$/i))) {
        result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'months'
      }
      break
    }
  }

  // Sex: "sex" keyword + next token (BIDS-style: sex-M, sex-female)
  for (let i = 0; i < tokens.length - 1; i++) {
    if (!/^sex$/i.test(tokens[i])) continue
    const next = tokens[i + 1]
    if (/^(m|male)$/i.test(next)) { result.sex = 'M'; break }
    if (/^(f|female)$/i.test(next)) { result.sex = 'F'; break }
  }
  // Sex: standalone token ("male", "female", "M", "F" — case-sensitive for single char)
  if (!result.sex) {
    for (const tok of tokens) {
      if (/^male$/i.test(tok))   { result.sex = 'M'; break }
      if (/^female$/i.test(tok)) { result.sex = 'F'; break }
      if (tok === 'M')           { result.sex = 'M'; break }
      if (tok === 'F')           { result.sex = 'F'; break }
    }
  }

  return result
}
