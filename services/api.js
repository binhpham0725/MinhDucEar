/**
 * MinhDucEar - Base API Fetch Client (hluv-magazine-architecture standard)
 * All services route through this module. Never call fetch() directly in pages or components.
 */

import { resolveApiUrl } from '../utils/helpers.js';

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Core JSON fetch with URL resolution, timeout, and error handling.
 * Returns parsed JSON on success or null on failure.
 */
export async function fetchJson(url, options = {}) {
  const fullUrl = resolveApiUrl(url);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(fullUrl, { signal: controller.signal, ...options });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[API] Request timeout: ${fullUrl}`);
    } else {
      console.warn(`[API] Fetch error on ${fullUrl}:`, err.message);
    }
    return null;
  }
}

/**
 * POST helper with JSON body
 */
export async function postJson(url, body = {}) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/**
 * POST helper with URL-encoded form data
 */
export async function postForm(url, params = {}) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  });
}
