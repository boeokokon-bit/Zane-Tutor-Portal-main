/**
 * Zane Tutors API Service
 * Communicates with WordPress REST API endpoints
 */

import { TutorProfile, OnboardingStep, VerificationStatus } from '@/types/tutor';

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

// In production, this points to your WP site. For local dev, you can override via env var.
const API_BASE = import.meta.env.VITE_WP_API_URL || 'https://facilitator.zanetutors.com.ng/wp-json/zane/v1';

// ── Token management ──
const TOKEN_KEY = 'zane_auth_token';
const COOKIE_NAME = 'zane_auth_token';
const COOKIE_DOMAIN = '.zanetutors.com.ng';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookieValue(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:';
  let cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=None;domain=${COOKIE_DOMAIN}`;
  if (secure) cookie += ';Secure';
  document.cookie = cookie;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:';
  let cookie = `${name}=;path=/;max-age=0;SameSite=None;domain=${COOKIE_DOMAIN}`;
  if (secure) cookie += ';Secure';
  document.cookie = cookie;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || getCookieValue(COOKIE_NAME);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  setCookieValue(COOKIE_NAME, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  removeCookie(COOKIE_NAME);
}

// ── Base fetch helper ──
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(error.message || res.statusText, res.status, error.code);
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Auth API ──
export interface LoginResponse {
  token: string;
  user: TutorProfile;
  is_admin: boolean;
}

export interface SignupResponse {
  token: string;
  user: TutorProfile;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    location: string;
    accountType?: 'academic' | 'skill';
    portalIntent?: 'teach' | 'lms';
    lmsTeachingTrack?: 'general' | 'academic';
  }) =>
    apiFetch<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ success: boolean; message: string; token?: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ── Tutor Profile API ──
export const tutorApi = {
  getProfile: () =>
    apiFetch<TutorProfile>('/tutor/profile'),

  updateProfile: (data: Partial<TutorProfile>) =>
    apiFetch<TutorProfile>('/tutor/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  advanceStep: (step: OnboardingStep) =>
    apiFetch<{ success: boolean; step: string }>('/tutor/advance-step', {
      method: 'POST',
      body: JSON.stringify({ step }),
    }),

  uploadPhoto: async (file: File): Promise<{ url: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/tutor/upload-photo`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(error.message, res.status);
    }

    return res.json();
  },

  uploadDocument: async (file: File): Promise<{ url: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/tutor/upload-doc`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(error.message, res.status);
    }

    return res.json();
  },
};

// ── Catalogue API (public) ──
export const catalogueApi = {
  getTutors: () =>
    apiFetch<TutorProfile[]>('/tutor-catalogue'),
  submitLead: (data: { tutorId: string; tutorName: string; parentName: string; parentEmail: string; parentPhone: string; message: string; offerAmount?: string }) =>
    apiFetch('/leads', { method: 'POST', body: JSON.stringify(data) }),
  getAssignedLeads: () =>
    apiFetch<any[]>('/tutor/assigned-leads'),
  getSettings: () =>
    apiFetch<{ whatsappNumber: string; contactEmail: string; commissionRate: number; portalNotice: string; showSkillsCatalogue: boolean; showAcademicsCatalogue: boolean }>('/settings'),
  updateSettings: (data: Partial<{ whatsappNumber: string; contactEmail: string; commissionRate: number; portalNotice: string; showSkillsCatalogue: boolean; showAcademicsCatalogue: boolean }>) =>
    apiFetch('/settings', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Admin API ──
export const adminApi = {
  getAllTutors: () =>
    apiFetch<TutorProfile[]>('/admin/tutors'),

  verifyTutor: (tutorId: string, status: VerificationStatus, notes?: string) =>
    apiFetch<{ success: boolean }>('/admin/verify', {
      method: 'POST',
      body: JSON.stringify({ tutorId, status, notes }),
    }),

  nudgeTutor: (tutorId: string) =>
    apiFetch<{ success: boolean }>('/admin/nudge', {
      method: 'POST',
      body: JSON.stringify({ tutorId }),
    }),

  getLeads: () =>
    apiFetch<any[]>('/admin/leads'),

  forwardLead: (tutorId: string, leadId: string) =>
    apiFetch('/admin/leads/forward', { method: 'POST', body: JSON.stringify({ tutorId, leadId }) }),

  archiveLead: (tutorId: string, leadId: string) =>
    apiFetch('/admin/leads/archive', { method: 'POST', body: JSON.stringify({ tutorId, leadId }) }),

  deleteTutor: (tutorId: string) =>
    apiFetch<{ success: boolean }>('/admin/delete', {
      method: 'POST',
      body: JSON.stringify({ tutorId }),
    }),
  getTutorAssessments: (tutorId: string): Promise<AssessmentSummary[]> =>
    apiFetch(`/admin/assessments/${tutorId}`),
};

// ── Reviews API ──
export const reviewsApi = {
  addReview: (tutorId: string, data: { reviewerName: string; rating: number; comment: string }) =>
    apiFetch<{ success: boolean; rating: number; reviewCount: number }>(
      `/tutor/${tutorId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
};

// ── Assessment API ──
export const assessmentApi = {
  saveAssessment: (resultData: Record<string, unknown>) =>
    apiFetch<{ id: number }>('/assessments', {
      method: 'POST',
      body: JSON.stringify({ result_data: resultData }),
    }),

  getAssessments: () =>
    apiFetch<AssessmentSummary[]>('/assessments'),

  getAssessment: (id: number) =>
    apiFetch<AssessmentDetail>(`/assessments/${id}`),
};
