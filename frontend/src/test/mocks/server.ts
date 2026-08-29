import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW server instance for tests
 * Start/stop/reset in test setup
 */
export const server = setupServer(...handlers)