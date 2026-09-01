import { StrictMode, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const ROOT_ID = 'root'
const MAX_ROOT_RETRIES = 3
const RETRY_DELAY_MS = 100

function createCleanRootElement(): HTMLElement {
  let rootElement = document.getElementById(ROOT_ID)
  
  if (!rootElement) {
    rootElement = document.createElement('div')
    rootElement.id = ROOT_ID
    document.body.appendChild(rootElement)
  }
  
  rootElement.setAttribute('data-react-root', 'true')
  
  return rootElement
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function showInitializationError(error: Error | null): void {
  const rootElement = createCleanRootElement()
  
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020617;
      color: #fbbf24;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="max-width: 28rem; text-align: center;">
        <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; font-family: Georgia, serif;">System Malfunction</h1>
        <p style="margin-bottom: 1.5rem; color: #94a3b8;">
          The cogitation engine encountered an initialization error. This may be caused by browser extensions.
        </p>
        <button onclick="window.location.reload()" style="
          padding: 0.75rem 1.5rem;
          background: #b45309;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-family: Georgia, serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          margin-bottom: 1rem;
        ">Reload Terminal</button>
        ${error ? `
          <details style="margin-top: 1.5rem; text-align: left; font-size: 0.75rem; color: #64748b;">
            <summary style="cursor: pointer;">Error Details</summary>
            <pre style="margin-top: 0.5rem; padding: 1rem; background: #0f172a; border-radius: 0.375rem; overflow: auto; white-space: pre-wrap; word-break: break-word;">${escapeHtml(error.toString())}</pre>
          </details>
        ` : ''}
        <div style="margin-top: 1.5rem; padding: 1rem; background: #1e293b; border-radius: 0.375rem; font-size: 0.75rem; color: #94a3b8; text-align: left;">
          <strong style="color: #fbbf24;">Troubleshooting:</strong>
          <ul style="margin-top: 0.5rem; padding-left: 1.25rem;">
            <li>Try refreshing the page</li>
            <li>Temporarily disable autofill extensions</li>
            <li>Try opening in an incognito/private window</li>
          </ul>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(rootElement)
}

function initializeApp(): void {
  let rootElement: HTMLElement | null = null
  let reactRoot: Root | null = null
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= MAX_ROOT_RETRIES; attempt++) {
    try {
      rootElement = createCleanRootElement()
      reactRoot = createRoot(rootElement)
      
      reactRoot.render(
        createElement(
          StrictMode,
          null,
          createElement(
            QueryClientProvider,
            { client: queryClient },
            createElement(App)
          )
        )
      )
      
      console.log('[App] React application initialized successfully')
      return
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[App] Root initialization attempt ${attempt} failed:`, lastError.message)
      
      if (rootElement && attempt < MAX_ROOT_RETRIES) {
        try {
          rootElement.remove()
        } catch {
          // Ignore cleanup errors
        }
      }
      
      if (attempt < MAX_ROOT_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt
        console.log(`[App] Retrying in ${delay}ms...`)
        const waitUntil = Date.now() + delay
        while (Date.now() < waitUntil) {
          // Busy wait for initialization
        }
      }
    }
  }
  
  console.error('[App] Failed to initialize after', MAX_ROOT_RETRIES, 'attempts')
  showInitializationError(lastError)
}

initializeApp()
