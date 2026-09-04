import re

with open(r"d:\Projekty\WH40k_Colony_Manager\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Find and replace loginApi function
pattern = r"(export async function loginApi\(username: string, password: string\): Promise<AuthSession> \{)[\s\S]*?(\n\})"

replacement = """export async function loginApi(username: string, password: string): Promise<AuthSession> {
  // Login sets HttpOnly cookies on the response
  await fetchApi<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }>(\'/auth/login\', {
    method: \'POST\',
    body: JSON.stringify({ username, password }),
  });

  // Fetch current user info (authentication via cookies)
  const user = await fetchApi<User>(\'/auth/me\');

  // Fetch CSRF token for state-changing requests
  const csrfResponse = await fetchApi<{ csrf_token: string }>(\'/auth/csrf-token\');
  setCsrfToken(csrfResponse.csrf_token);

  // Return session info (tokens are in cookies, not stored client-side)
  const session: AuthSession = {
    access_token: \'\', // Not stored client-side anymore
    refresh_token: \'\', // Not stored client-side anymore
    token_type: \'bearer\',
    expires_in: 1800,
    user,
  };

  return session;
}"""

new_content = re.sub(pattern, replacement, content)

if new_content != content:
    print("Replaced loginApi")
    with open(r"d:\Projekty\WH40k_Colony_Manager\src\lib\api.ts", "w", encoding="utf-8") as f:
        f.write(new_content)
else:
    print("Pattern not matched")