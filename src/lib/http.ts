export interface JsonFetchResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
  errorMessage?: string;
}

export async function safeFetchJson<T = Record<string, unknown>>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<JsonFetchResult<T>> {
  const response = await fetch(input, init);
  const rawText = await response.text();
  const trimmed = rawText.trim();

  if (!trimmed) {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      rawText,
      errorMessage: response.ok
        ? undefined
        : `Server returned an empty response (HTTP ${response.status}).`,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as T;
    return {
      ok: response.ok,
      status: response.status,
      data: parsed,
      rawText,
    };
  } catch {
    const looksLikeHtml =
      trimmed.startsWith('<') ||
      trimmed.toLowerCase().startsWith('<!doctype') ||
      (response.headers.get('content-type') || '').includes('text/html');

    return {
      ok: false,
      status: response.status,
      data: null,
      rawText,
      errorMessage: looksLikeHtml
        ? `The backend API returned an HTML page instead of JSON (HTTP ${response.status}). Please refresh the page or check that the Node.js server is running.`
        : `Invalid response received from server (HTTP ${response.status}).`,
    };
  }
}
