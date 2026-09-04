import re

with open('d:\\\\Projekty\\\\WH40k_Colony_Manager\\\\src\\\\lib\\\\api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

csrf_section = '''// ============================================================================
// CSRF Token Management
// ============================================================================

/**
 * CSRF token for state-changing requests.
 * Fetched after login and included in POST/PUT/PATCH/DELETE requests.
 */
let csrfToken: string | null = null;

/**
 * Set the CSRF token (called after successful login).
 * @param token - CSRF token from backend
 */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/**
 * Get the current CSRF token.
 * @returns CSRF token or null if not set
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Clear the CSRF token (called on logout).
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}'''

content = re.sub(
    r'// =+\s*Auth Storage\s*=+\s*\nexport const authStorage = \{[^}]+(?:\{[^}]*\}[^}]*)*\};',
    csrf_section,
    content,
    flags=re.DOTALL
)

with open('d:\\\\Projekty\\\\WH40k_Colony_Manager\\\\src\\\\lib\\\\api.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Step 1 done')
