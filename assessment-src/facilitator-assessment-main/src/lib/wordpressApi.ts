const API_BASE = 'https://zanetutors.com.ng/wp-json/zane/v1';

const getToken = (): string | null => localStorage.getItem('zane_auth_token');

const authHeaders = (): HeadersInit => {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
  } catch (networkErr) {
    // Network failure or CORS preflight blocked — give an actionable message
    console.error('[wpApi] Network error on', endpoint, networkErr);
    throw new Error(
      'Cannot reach the server. This is usually a CORS or network issue. ' +
      'Check that the WordPress plugin is active and the plugin CORS settings allow this domain.'
    );
  }

  // Guard against non-JSON responses (e.g. WP returns HTML on 500)
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.error('[wpApi] Non-JSON response on', endpoint, res.status, text.slice(0, 200));
    throw new Error(`Server returned an unexpected response (HTTP ${res.status}). Check the WordPress error log.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (HTTP ${res.status})`);
  return data as T;
};


export interface WPUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  roles?: string[]; // WordPress user roles, e.g. ['parent-student'], ['um_learner'], ['administrator']
}

export interface LoginResponse {
  token: string;
  user: WPUser;
}

export interface SubjectScore {
  subject: string;
  score: number;
  total: number;
  percentage: number;
  status: string;
}

export interface AssessmentSummary {
  id: number;
  date: string;
  overall_score: number;
  readiness_level: string;
  subjects: string[];
  subject_scores?: SubjectScore[];
}

export interface AssessmentDetail extends AssessmentSummary {
  result_data: Record<string, unknown>;
}

export const wpApi = {
  register: (data: { first_name: string; last_name: string; email: string; password: string }) =>
    request<LoginResponse>('/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (email: string, password: string) =>
    request<LoginResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () => request<{ success: boolean }>('/logout', { method: 'POST' }),

  me: () => request<WPUser>('/me'),

  saveAssessment: (resultData: Record<string, unknown>) =>
    request<{ id: number }>('/assessments', { method: 'POST', body: JSON.stringify({ result_data: resultData }) }),

  getAssessments: () => request<AssessmentSummary[]>('/assessments'),

  getAssessment: (id: number) => request<AssessmentDetail>(`/assessments/${id}`),
};
