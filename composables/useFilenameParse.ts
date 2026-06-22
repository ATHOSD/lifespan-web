export interface ParsedMeta {
  modality?: string
  sex?: 'M' | 'F'
  ageType?: 'GA' | 'Postnatal'
  ageValue?: number
  ageUnit?: 'weeks' | 'months' | 'years'
}

const MODALITY_PATTERNS: [string, RegExp][] = [
  ['T1w', /^T1w$/i],
  ['T2w', /^T2w$/i],
  ['FA',  /^FA$/i],
  ['MD',  /^MD$/i],
]

// Parse modality, age, and sex from an MRI filename
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

  // Age: match directly on the base string (not tokens) so decimal numbers like 37.43 work.
  // The tokenizer splits on '.', which would break "GA37.43wk" into "GA37" and "43wksub".
  // Boundary before: not a letter or digit. After GA patterns: not a digit (allows "sub" to follow).
  // After postnatal patterns: not a letter or digit.
  {
    let m: RegExpMatchArray | null
    // GA prefix: GA37.43, GA37.43wk, GA37.43wks, GA37.43weeks
    if ((m = base.match(/(?<![A-Za-z0-9])GA(\d+(?:\.\d+)?)(?:w(?:ks?|eeks?)?)?(?![0-9])/i))) {
      result.ageType = 'GA'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'
    }
    // GA suffix: 37.43GA, 37.43wGA, 37.43wksGA
    else if ((m = base.match(/(?<![A-Za-z0-9])(\d+(?:\.\d+)?)(?:w(?:ks?|eeks?)?)?GA(?![A-Za-z0-9])/i))) {
      result.ageType = 'GA'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'
    }
    // Postnatal weeks: 5.2w, 5.2wk, 5.2wks, 5.2weeks (no GA marker)
    else if ((m = base.match(/(?<![A-Za-z0-9])(\d+(?:\.\d+)?)w(?:ks?|eeks?)?(?![A-Za-z0-9])/i))) {
      result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'
    }
    // Postnatal years: 5.5y, 5.5yr, 5.5years
    else if ((m = base.match(/(?<![A-Za-z0-9])(\d+(?:\.\d+)?)y(?:r|rs|ears?)?(?![A-Za-z0-9])/i))) {
      result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'years'
    }
    // Postnatal months: 6.5mo, 6.5months
    else if ((m = base.match(/(?<![A-Za-z0-9])(\d+(?:\.\d+)?)mo(?:n(?:th)?s?)?(?![A-Za-z0-9])/i))) {
      result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'months'
    }
  }

  // "age" keyword prefix (BIDS-style: age-37.43wk, age-5.5y) — only if not already found
  if (result.ageValue === undefined) {
    const keyMatch = base.match(/(?<![A-Za-z])age[^A-Za-z0-9]*/i)
    if (keyMatch) {
      const rest = base.slice(keyMatch.index! + keyMatch[0].length)
      let m: RegExpMatchArray | null
      if ((m = rest.match(/^GA(\d+(?:\.\d+)?)(?:w(?:ks?|eeks?)?)?/i)) || (m = rest.match(/^(\d+(?:\.\d+)?)(?:w(?:ks?|eeks?)?)?GA/i))) {
        result.ageType = 'GA'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'
      } else if ((m = rest.match(/^(\d+(?:\.\d+)?)w(?:ks?|eeks?)?/i))) {
        result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'weeks'
      } else if ((m = rest.match(/^(\d+(?:\.\d+)?)y(?:r|rs|ears?)?/i))) {
        result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'years'
      } else if ((m = rest.match(/^(\d+(?:\.\d+)?)mo(?:n(?:th)?s?)?/i))) {
        result.ageType = 'Postnatal'; result.ageValue = parseFloat(m[1]); result.ageUnit = 'months'
      }
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
