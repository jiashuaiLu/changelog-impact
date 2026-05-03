import { request } from 'undici';

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'changelog-impact/0.2.0',
};

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export async function httpGet(url: string, options?: RequestOptions): Promise<{ statusCode: number; body: string }> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const headers = { ...DEFAULT_HEADERS, ...options?.headers };

  const { statusCode, body } = await request(url, {
    method: options?.method || 'GET',
    headers,
    body: options?.body,
    headersTimeout: timeout,
    bodyTimeout: timeout,
  });

  const text = await body.text();
  return { statusCode, body: text };
}

export async function httpPost(url: string, options?: RequestOptions): Promise<{ statusCode: number; body: string }> {
  return httpGet(url, { ...options, method: 'POST' });
}

export function getGitHubAuthHeaders(token?: string): Record<string, string> {
  const t = token || process.env.GITHUB_TOKEN;
  if (t) {
    return {
      Authorization: `Bearer ${t}`,
      Accept: 'application/vnd.github+json',
    };
  }
  return {
    Accept: 'application/vnd.github+json',
  };
}
