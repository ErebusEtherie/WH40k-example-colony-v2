import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

/**
 * Creates a QueryClient instance for tests
 * Default options prevent retries and use short stale times
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Wrapper component for rendering with QueryClientProvider
 */
export function wrapperWithQueryClient({ children }: { children: ReactNode }) {
  const client = createTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/**
 * Custom render function that includes QueryClientProvider
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    ...renderOptions
  }: {
    preloadedState?: Record<string, any>
  } & Record<string, any> = {}
) {
  return {
    ...render(ui, {
      wrapper: wrapperWithQueryClient,
      ...renderOptions,
    }),
  }
}

/**
 * Custom renderHook function that includes QueryClientProvider
 */
export function renderHookWithProviders<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: {
    initialProps?: TProps
  }
) {
  return renderHook(hook, {
    wrapper: wrapperWithQueryClient,
    ...options,
  })
}