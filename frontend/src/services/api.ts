const API_BASE = '';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, config: RequestConfig = {}): Promise<T> {
  const { params, headers: customHeaders, ...rest } = config;

  let fullUrl = `${API_BASE}${url}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    fullUrl += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    ...rest,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(url: string, params?: Record<string, string>) =>
    request<T>(url, { method: 'GET', params }),

  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    }),

  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    }),

  delete: <T>(url: string) =>
    request<T>(url, { method: 'DELETE' }),
};
