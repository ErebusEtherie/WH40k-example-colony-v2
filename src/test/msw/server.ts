import { setupServer } from "msw/node";
import {
  colonyTypesHandler,
  authLoginHandler,
  authMeHandler,
  authCsrfTokenHandler,
} from "./handlers";

/**
 * MSW server for the unit/component test run. Handlers are typed against the
 * same ColonyTypeInfo shape the api/ hooks consume, so a backend schema change
 * that alters /config/colony-types breaks the mock at type-check time rather
 * than failing silently (contract-drift safeguard per 08-frontend-testing.md).
 */
export const server = setupServer(
  colonyTypesHandler,
  authLoginHandler,
  authMeHandler,
  authCsrfTokenHandler
);
