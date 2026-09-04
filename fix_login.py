with open(r"d:\Projekty\WH40k_Colony_Manager\src\lib\api.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_login = """export async function loginApi(username: string, password: string): Promise<AuthSession> {
  const response = await fetchApi<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }>(\'/auth/login\', {
    method: \'POST\',
    body: JSON.stringify({ username, password }),
  });

  // Save the session immediately so the access token is available for the /me call
  const session: AuthSession = {
    ...response,
    user: null,
  };
  authStorage.saveSession(session);

  // Fetch current user info (now the token is available in localStorage)
  const user = await fetchApi<User>(\'/auth/me\');

  // Update session with user data
  session.user = user;
  authStorage.saveSession(session);

  return session;
}"""

new_login = """export async function loginApi(username: string, password: string): Promise<AuthSession> {
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

content = content.replace(old_login, new_login)
print("Done" if "authStorage.saveSession" not in content else "Still has authStorage")

with open(r"d:\Projekty\WH40k_Colony_Manager\src\lib\api.ts", "w", encoding="utf-8") as f:
    f.write(content)