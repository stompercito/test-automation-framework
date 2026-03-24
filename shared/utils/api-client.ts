import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Thin wrapper around Playwright's APIRequestContext that adds:
 *  - Automatic JSON serialisation / deserialisation
 *  - Standardised error messages
 *  - A hook-friendly interface for use in BDD Before hooks
 *
 * Every API client in shared/clients/ extends this class.
 */
export abstract class ApiClient {
  constructor(protected readonly api: APIRequestContext) {}

  protected async get<T>(
    path: string,
    options?: { headers?: Record<string, string>; params?: Record<string, string | number> },
  ): Promise<{ status: number; body: T }> {
    const response = await this.api.get(path, { headers: options?.headers, params: options?.params });
    return this.parse<T>(response);
  }

  protected async post<T>(
    path: string,
    data: unknown,
    options?: { headers?: Record<string, string> },
  ): Promise<{ status: number; body: T }> {
    const response = await this.api.post(path, { data, headers: options?.headers });
    return this.parse<T>(response);
  }

  protected async put<T>(
    path: string,
    data: unknown,
    options?: { headers?: Record<string, string> },
  ): Promise<{ status: number; body: T }> {
    const response = await this.api.put(path, { data, headers: options?.headers });
    return this.parse<T>(response);
  }

  protected async delete<T>(
    path: string,
    options?: { headers?: Record<string, string> },
  ): Promise<{ status: number; body: T }> {
    const response = await this.api.delete(path, { headers: options?.headers });
    return this.parse<T>(response);
  }

  private async parse<T>(response: APIResponse): Promise<{ status: number; body: T }> {
    const status = response.status();
    let body: T;
    try {
      body = await response.json() as T;
    } catch {
      body = (await response.text()) as unknown as T;
    }
    return { status, body };
  }
}
