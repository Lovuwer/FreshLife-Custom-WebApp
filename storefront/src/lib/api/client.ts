const ERPNEXT_URL = process.env.ERPNEXT_URL!;
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY!;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET!;

interface ERPNextOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  userToken?: string;
}

export async function erpnextFetch<T>(
  path: string,
  options: ERPNextOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, userToken } = options;

  const url = new URL(`${ERPNEXT_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: userToken
      ? `token ${userToken}`
      : `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ERPNextError(response.status, error);
  }

  const data = await response.json();
  return data.message ?? data.data ?? data;
}

export class ERPNextError extends Error {
  constructor(
    public status: number,
    public details: unknown
  ) {
    super(`ERPNext API Error: ${status}`);
  }
}
