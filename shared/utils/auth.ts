import { config } from '../config/config';

export function buildApiAuthHeaders(overrides?: {
  token?: string;
}): Record<string, string> {
  const token = overrides?.token ?? config.apiAuth.token;
  if (token) {
    return { Authorization: `Basic ${token}` };
  }

  return {};
}
