import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

// Cleanup after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Close MSW server after all tests
afterAll(() => server.close())