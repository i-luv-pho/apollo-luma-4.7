/**
 * Placeholder Detection Utility
 * Detects common placeholder patterns to enforce no-mock-data rules
 */

const PLACEHOLDER_PATTERNS = [
  /\[.*?TODO.*?\]/gi,
  /\[.*?(placeholder|replace|fill|unknown|pending).*?\]/gi,
  /XXX|FIXME|TBD|STUB/g,
  /(TODO|FIXME|WIP|HACK):/g,
  /\$\{.*?\}/g,
  /\[\w+\]/g,
  /\[your.*?\]/gi,
  /\[insert.*?\]/gi,
  /\[add.*?\]/gi,
  /\[company.*?\]/gi,
  /\[name.*?\]/gi,
  /\[date.*?\]/gi,
  /\[number.*?\]/gi,
  /lorem ipsum/gi,
]

/**
 * Detect all placeholder patterns in text
 * @param text - Text to scan for placeholders
 * @returns Array of found placeholder strings
 */
export function detectPlaceholders(text: string): string[] {
  const found: string[] = []
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) found.push(...matches)
  }
  return [...new Set(found)]
}

/**
 * Check if text contains any placeholders
 * @param text - Text to check
 * @returns true if placeholders found
 */
export function hasPlaceholders(text: string): boolean {
  return detectPlaceholders(text).length > 0
}

/**
 * Validate text has no placeholders
 * @param text - Text to validate
 * @returns Validation result with issues list
 */
export function validateNoPlaceholders(text: string): { valid: boolean; issues: string[] } {
  const placeholders = detectPlaceholders(text)
  return {
    valid: placeholders.length === 0,
    issues: placeholders.length > 0
      ? [`Found placeholder text: ${placeholders.join(', ')}`]
      : []
  }
}

/**
 * Strip placeholders from text (for cleanup)
 * @param text - Text to clean
 * @returns Text with placeholders removed
 */
export function stripPlaceholders(text: string): string {
  let result = text
  for (const pattern of PLACEHOLDER_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result.trim()
}
