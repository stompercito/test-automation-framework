import { config } from '../config/config';

export function buildApiAuthHeaders(overrides?: {
  token?: string;
  username?: string;
  password?: string;
}): Record<string, string> {
  const token = overrides?.token ?? config.apiAuth.token;
  if (token) {
    return { Authorization: `Basic ${token}` };
  }

  const username = overrides?.username ?? config.apiAuth.username ?? config.credentials.username;
  const password = overrides?.password ?? config.apiAuth.password ?? config.credentials.password;

  if (username && password) {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  return {};
}
