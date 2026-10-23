const BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

export async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.message || (Array.isArray(data.error) ? data.error[0]?.message : data.error) || 'Something went wrong';
    throw new Error(errorMsg);
  }

  return data;
}