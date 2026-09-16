import { ApiError } from "./api";

export interface NormalizedApiError {
  status: number | null;
  message: string;
}

/**
 * Shared error normalizer for the API client layer.
 *
 * Maps any error thrown during an API call to a stable { status, message } shape
 * so UI code can treat it uniformly instead of a per-feature try/catch. Per
 * 07-frontend-architecture.md this is the single shared function all features
 * route their API errors through; extend it here rather than working around it
 * locally when a new case appears.
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof Error) {
    return { status: null, message: error.message };
  }
  return {
    status: null,
    message: "An unknown error occurred. Please try again.",
  };
}
