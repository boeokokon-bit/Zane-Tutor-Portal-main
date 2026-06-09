/**
 * Zane Tutors — Apps Script API Client
 * 
 * This module provides a client for communicating with the Google Apps Script
 * web app endpoints. It acts as a fallback layer when the WordPress API is
 * unavailable.
 * 
 * Architecture:
 *   - WP API = primary (live app data)
 *   - Apps Script = fallback/sync/reporting layer
 *   - Google Sheets = structured storage with multiple tabs
 * 
 * Usage:
 *   - Import and use the functions directly
 *   - The fallback logic is integrated into the existing API layer
 */

import { TutorProfile, VerificationStatus } from '@/types/tutor';
import { AssessmentResult, SUBJECT_LABELS } from '@/types/assessment';

// ── Configuration ──
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// ── Types ──
export interface AppsScriptResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
  tutors?: TutorProfile[];
  tutor?: TutorProfile;
  assessments?: any[];
  reviews?: any[];
  documents?: any[];
  count?: number;
  id?: string;
  rating?: number;
  reviewCount?: number;
  imported?: number;
}

export interface AppsScriptHealth {
  status: string;
  timestamp: string;
}

// ── Helper: Check if Apps Script is configured ──
export function isAppsScriptConfigured(): boolean {
  return !!APPS_SCRIPT_URL;
}

// ── Helper: Make a GET request to Apps Script ──
async function appsScriptGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Apps Script URL not configured');
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Apps Script GET error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ── Helper: Make a POST request to Apps Script ──
async function appsScriptPost<T>(action: string, body: any): Promise<T> {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Apps Script URL not configured');
  }

  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Apps Script POST error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API — Tutor Operations
// ══════════════════════════════════════════════════════════════

/**
 * Get all tutors from Apps Script
 */
export async function getTutors(): Promise<TutorProfile[]> {
  const result = await appsScriptGet<AppsScriptResponse>('getTutors');
  return (result.tutors || []).map(normalizeTutorFromSheet);
}

/**
 * Get a single tutor by ID
 */
export async function getTutor(id: string): Promise<TutorProfile | null> {
  const result = await appsScriptGet<AppsScriptResponse>('getTutor', { id });
  if (!result.tutor) return null;
  return normalizeTutorFromSheet(result.tutor);
}

/**
 * Get the public catalogue (verified tutors only)
 */
export async function getCatalogue(): Promise<TutorProfile[]> {
  const result = await appsScriptGet<AppsScriptResponse>('getCatalogue');
  return (result.tutors || []).map(normalizeTutorFromSheet);
}

/**
 * Get all tutors for admin (includes unverified)
 */
export async function getAdminTutors(): Promise<TutorProfile[]> {
  const result = await appsScriptGet<AppsScriptResponse>('getAdminTutors');
  return (result.tutors || []).map(normalizeTutorFromSheet);
}

/**
 * Save a new tutor
 */
export async function saveTutor(tutor: Partial<TutorProfile>): Promise<{ success: boolean; id: string }> {
  const result = await appsScriptPost<AppsScriptResponse>('saveTutor', tutor);
  return { success: !!result.success, id: result.id || '' };
}

/**
 * Update an existing tutor
 */
export async function updateTutor(tutor: Partial<TutorProfile>): Promise<{ success: boolean }> {
  const result = await appsScriptPost<AppsScriptResponse>('updateTutor', tutor);
  return { success: !!result.success };
}

/**
 * Verify a tutor (admin action)
 */
export async function verifyTutor(tutorId: string, status: VerificationStatus, notes?: string): Promise<{ success: boolean }> {
  const result = await appsScriptPost<AppsScriptResponse>('verifyTutor', { tutorId, status, notes });
  return { success: !!result.success };
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API — Assessment Operations
// ══════════════════════════════════════════════════════════════

/**
 * Save an assessment result to Apps Script
 */
export async function saveAssessment(result: AssessmentResult): Promise<{ success: boolean; id: string }> {
  const subjectResults = result.subjectResults || [];
  
  const payload = {
    tutorId: '',
    tutorName: `${result.studentInfo.firstName} ${result.studentInfo.lastName}`.trim(),
    email: result.studentInfo.email,
    overallScore: result.finalReadinessScore,
    overallPassed: result.overallPassed ? 'Yes' : 'No',
    readinessLevel: result.readinessLevel,
    subjects: subjectResults.map(s => ({
      name: SUBJECT_LABELS[s.subject],
      score: s.percentage,
      passed: s.passed ? 'Yes' : 'No',
    })),
    subjectScores: subjectResults.map(s => ({
      subject: SUBJECT_LABELS[s.subject],
      score: s.score,
      total: s.totalQuestions,
      percentage: s.percentage,
      status: s.status,
    })),
    yearsExperience: result.studentInfo.yearsExperience,
    educationLevel: result.studentInfo.educationLevel,
    resultData: result,
    psychResults: result.psychResults || [],
    digitalToolsResults: result.digitalToolsResults || [],
  };

  const response = await appsScriptPost<AppsScriptResponse>('saveAssessment', payload);
  return { success: !!response.success, id: response.id || '' };
}

/**
 * Get assessments, optionally filtered by tutorId
 */
export async function getAssessments(tutorId?: string): Promise<any[]> {
  const params: Record<string, string> = {};
  if (tutorId) params.tutorId = tutorId;
  
  const result = await appsScriptGet<AppsScriptResponse>('getAssessments', params);
  return result.assessments || [];
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API — Review Operations
// ══════════════════════════════════════════════════════════════

/**
 * Add a review for a tutor
 */
export async function addReview(tutorId: string, data: { reviewerName: string; rating: number; comment: string }): Promise<{ success: boolean; rating: number; reviewCount: number }> {
  const result = await appsScriptPost<AppsScriptResponse>('addReview', { tutorId, ...data });
  return {
    success: !!result.success,
    rating: result.rating || 0,
    reviewCount: result.reviewCount || 0,
  };
}

/**
 * Get reviews, optionally filtered by tutorId
 */
export async function getReviews(tutorId?: string): Promise<any[]> {
  const params: Record<string, string> = {};
  if (tutorId) params.tutorId = tutorId;
  
  const result = await appsScriptGet<AppsScriptResponse>('getReviews', params);
  return result.reviews || [];
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API — Document Operations
// ══════════════════════════════════════════════════════════════

/**
 * Save a document record
 */
export async function saveDocument(tutorId: string, fileName: string, url: string, expiryDate?: string): Promise<{ success: boolean; id: string }> {
  const result = await appsScriptPost<AppsScriptResponse>('saveDocument', { tutorId, fileName, url, expiryDate });
  return { success: !!result.success, id: result.id || '' };
}

/**
 * Get documents, optionally filtered by tutorId
 */
export async function getDocuments(tutorId?: string): Promise<any[]> {
  const params: Record<string, string> = {};
  if (tutorId) params.tutorId = tutorId;
  
  const result = await appsScriptGet<AppsScriptResponse>('getDocuments', params);
  return result.documents || [];
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API — Import/Export (for CSV migration)
// ══════════════════════════════════════════════════════════════

/**
 * Import tutors in bulk (one-time migration)
 */
export async function importTutors(tutors: Partial<TutorProfile>[]): Promise<{ success: boolean; imported: number }> {
  const result = await appsScriptPost<AppsScriptResponse>('importTutors', { tutors });
  return { success: !!result.success, imported: result.imported || 0 };
}

/**
 * Export all tutors
 */
export async function exportTutors(): Promise<TutorProfile[]> {
  const result = await appsScriptGet<AppsScriptResponse>('exportTutors');
  return (result.tutors || []).map(normalizeTutorFromSheet);
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API — Health Check
// ══════════════════════════════════════════════════════════════

/**
 * Check if Apps Script is reachable
 */
export async function healthCheck(): Promise<AppsScriptHealth | null> {
  try {
    const result = await appsScriptGet<AppsScriptHealth>('health');
    return result;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// DATA NORMALIZATION
// ══════════════════════════════════════════════════════════════

/**
 * Normalize a tutor row from Google Sheets to TutorProfile format.
 * Sheets stores arrays as JSON strings, so we need to parse them.
 */
function normalizeTutorFromSheet(row: any): TutorProfile {
  return {
    id: row.id || '',
    email: row.email || '',
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    phone: row.phone || '',
    location: row.location || '',
    profilePhoto: row.profilePhoto || '',
    qualification: row.qualification || '',
    macroCategory: row.macroCategory || '',
    subjects: parseJsonField(row.subjects, []),
    experience: Number(row.experience) || 0,
    hourlyRate: Number(row.hourlyRate) || 0,
    briefIntro: row.briefIntro || '',
    preferredLevels: parseJsonField(row.preferredLevels, []),
    currentWork: row.currentWork || '',
    availability: row.availability || '',
    availabilitySlots: parseJsonField(row.availabilitySlots, []),
    teachingHistory: row.teachingHistory || '',
    classDelivery: row.classDelivery || '',
    classType: row.classType || '',
    trcnCertified: row.trcnCertified === 'true' || row.trcnCertified === true,
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.reviewCount) || 0,
    isVerified: row.isVerified === 'true' || row.isVerified === true,
    verificationStatus: row.verificationStatus || 'pending',
    adminNotes: row.adminNotes || '',
    onboardingStep: row.onboardingStep || 'signup',
    createdAt: row.createdAt || new Date().toISOString(),
    accountType: row.accountType || '',
    gender: row.gender || '',
    dob: row.dob || '',
    stateOfOrigin: row.stateOfOrigin || '',
    portalIntent: row.portalIntent || '',
    lmsTeachingTrack: row.lmsTeachingTrack || '',
    lastOnline: row.lastOnline || '',
    profileViews: Number(row.profileViews) || 0,
    hiddenFromCatalogue: row.hiddenFromCatalogue === 'true' || row.hiddenFromCatalogue === true,
    lastNudgedAt: row.lastNudgedAt || '',
  };
}

/**
 * Parse a JSON string field, returning a default if parsing fails.
 */
function parseJsonField<T>(value: any, defaultValue: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return value as T;
  }
  return defaultValue;
}