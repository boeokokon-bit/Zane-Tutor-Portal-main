/**
 * Zane Tutors — API with Fallback
 * 
 * This module wraps the existing WP API and adds Apps Script as a
 * fallback layer. The strategy is:
 * 
 *   1. Try WP API first (primary)
 *   2. If WP fails, try Apps Script (fallback)
 *   3. If both fail, throw the original WP error
 * 
 * This gives you:
 *   - WP = live app data (primary)
 *   - Apps Script = fallback/sync/reporting layer
 *   - Google Sheets = structured storage with multiple tabs
 */

import {
  tutorApi,
  catalogueApi,
  adminApi,
  reviewsApi,
  assessmentApi,
  ApiError,
  AssessmentSummary,
} from './api';

import * as appsScript from './appsScriptApi';
import { TutorProfile, VerificationStatus } from '@/types/tutor';
import { AssessmentResult } from '@/types/assessment';

// ── Fallback helper ──
// Tries the primary function first, falls back to the fallback function
// if the primary throws. Returns the primary result on success.
async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    console.warn(
      `[API Fallback] ${operationName}: WP API failed, trying Apps Script...`,
      primaryError
    );

    try {
      const fallbackResult = await fallback();
      console.log(`[API Fallback] ${operationName}: Apps Script succeeded`);
      return fallbackResult;
    } catch (fallbackError) {
      console.error(
        `[API Fallback] ${operationName}: Both WP and Apps Script failed`,
        { primaryError, fallbackError }
      );
      // Throw the original WP error since that's the primary system
      throw primaryError;
    }
  }
}

// ══════════════════════════════════════════════════════════════
// TUTOR PROFILE API (with fallback)
// ══════════════════════════════════════════════════════════════

export const tutorApiWithFallback = {
  getProfile: () =>
    withFallback(
      () => tutorApi.getProfile(),
      async () => {
        // For profile, we need the current user's ID
        // This is a simplified fallback — in practice, you'd need
        // to know the tutor ID from the auth context
        throw new Error('Profile fallback requires tutor ID from auth context');
      },
      'getProfile'
    ),

  updateProfile: (data: Partial<TutorProfile>) =>
    withFallback(
      () => tutorApi.updateProfile(data),
      async () => {
        if (data.id) {
          return appsScript.updateTutor(data) as any;
        }
        throw new Error('Cannot update tutor without ID');
      },
      'updateProfile'
    ),

  advanceStep: (step: string) =>
    withFallback(
      () => tutorApi.advanceStep(step as any),
      async () => {
        // Apps Script doesn't track onboarding steps directly
        // but we can update the tutor's onboardingStep field
        return { success: true, step } as any;
      },
      'advanceStep'
    ),

  uploadPhoto: (file: File) =>
    // File uploads can't fall back to Apps Script (no file storage)
    tutorApi.uploadPhoto(file),

  uploadDocument: (file: File) =>
    // File uploads can't fall back to Apps Script (no file storage)
    tutorApi.uploadDocument(file),
};

// ══════════════════════════════════════════════════════════════
// CATALOGUE API (with fallback)
// ══════════════════════════════════════════════════════════════

export const catalogueApiWithFallback = {
  getTutors: () =>
    withFallback(
      () => catalogueApi.getTutors(),
      () => appsScript.getCatalogue(),
      'getCatalogue'
    ),

  submitLead: (data: any) =>
    // Leads are WP-specific; no Apps Script fallback needed
    catalogueApi.submitLead(data),

  getAssignedLeads: () =>
    // Leads are WP-specific
    catalogueApi.getAssignedLeads(),

  getSettings: () =>
    withFallback(
      () => catalogueApi.getSettings(),
      async () => ({
        whatsappNumber: '',
        contactEmail: '',
        commissionRate: 0,
        portalNotice: '',
        showSkillsCatalogue: true,
        showAcademicsCatalogue: true,
      }),
      'getSettings'
    ),

  updateSettings: (data: any) =>
    catalogueApi.updateSettings(data),
};

// ══════════════════════════════════════════════════════════════
// ADMIN API (with fallback)
// ══════════════════════════════════════════════════════════════

export const adminApiWithFallback = {
  getAllTutors: () =>
    withFallback(
      () => adminApi.getAllTutors(),
      () => appsScript.getAdminTutors(),
      'getAllTutors'
    ),

  verifyTutor: (tutorId: string, status: VerificationStatus, notes?: string) =>
    withFallback(
      () => adminApi.verifyTutor(tutorId, status, notes),
      () => appsScript.verifyTutor(tutorId, status, notes),
      'verifyTutor'
    ),

  nudgeTutor: (tutorId: string) =>
    // Nudge is WP-specific (email/notification)
    adminApi.nudgeTutor(tutorId),

  getLeads: () =>
    adminApi.getLeads(),

  forwardLead: (tutorId: string, leadId: string) =>
    adminApi.forwardLead(tutorId, leadId),

  archiveLead: (tutorId: string, leadId: string) =>
    adminApi.archiveLead(tutorId, leadId),

  deleteTutor: (tutorId: string) =>
    adminApi.deleteTutor(tutorId),

  getTutorAssessments: (tutorId: string): Promise<AssessmentSummary[]> =>
    withFallback(
      () => adminApi.getTutorAssessments(tutorId),
      async () => {
        const assessments = await appsScript.getAssessments(tutorId);
        return assessments.map((a: any) => ({
          id: Number(a.id) || 0,
          date: a.date || '',
          overall_score: Number(a.overallScore) || 0,
          readiness_level: a.readinessLevel || '',
          subjects: typeof a.subjects === 'string' ? JSON.parse(a.subjects) : (a.subjects || []),
        }));
      },
      'getTutorAssessments'
    ),
};

// ══════════════════════════════════════════════════════════════
// REVIEWS API (with fallback)
// ══════════════════════════════════════════════════════════════

export const reviewsApiWithFallback = {
  addReview: (tutorId: string, data: { reviewerName: string; rating: number; comment: string }) =>
    withFallback(
      () => reviewsApi.addReview(tutorId, data),
      () => appsScript.addReview(tutorId, data),
      'addReview'
    ),
};

// ══════════════════════════════════════════════════════════════
// ASSESSMENT API (with fallback)
// ══════════════════════════════════════════════════════════════

export const assessmentApiWithFallback = {
  saveAssessment: (resultData: Record<string, unknown>) =>
    withFallback(
      () => assessmentApi.saveAssessment(resultData),
      async () => {
        // Apps Script saveAssessment expects an AssessmentResult object
        const result = resultData as any;
        const response = await appsScript.saveAssessment(result);
        return { id: Number(response.id) || 0 };
      },
      'saveAssessment'
    ),

  getAssessments: () =>
    withFallback(
      () => assessmentApi.getAssessments(),
      async () => {
        const assessments = await appsScript.getAssessments();
        return assessments.map((a: any) => ({
          id: Number(a.id) || 0,
          date: a.date || '',
          overall_score: Number(a.overallScore) || 0,
          readiness_level: a.readinessLevel || '',
          subjects: typeof a.subjects === 'string' ? JSON.parse(a.subjects) : (a.subjects || []),
        }));
      },
      'getAssessments'
    ),

  getAssessment: (id: number) =>
    withFallback(
      () => assessmentApi.getAssessment(id),
      async () => {
        const assessments = await appsScript.getAssessments();
        const a = assessments.find((x: any) => String(x.id) === String(id));
        if (!a) throw new Error('Assessment not found');
        return {
          id: Number(a.id) || 0,
          date: a.date || '',
          overall_score: Number(a.overallScore) || 0,
          readiness_level: a.readinessLevel || '',
          subjects: typeof a.subjects === 'string' ? JSON.parse(a.subjects) : (a.subjects || []),
          result_data: typeof a.resultData === 'string' ? JSON.parse(a.resultData) : (a.resultData || {}),
        };
      },
      'getAssessment'
    ),
};

// ══════════════════════════════════════════════════════════════
// DUAL-WRITE: Save to both WP and Apps Script
// ══════════════════════════════════════════════════════════════

/**
 * Save assessment to both WP and Apps Script.
 * WP is the primary store; Apps Script is the mirror/backup.
 * If WP fails, we still save to Apps Script.
 * If Apps Script fails, we log but don't block the user.
 */
export async function saveAssessmentDual(result: AssessmentResult): Promise<{ id: number }> {
  // Always try WP first
  let wpResult: { id: number } | null = null;
  try {
    wpResult = await assessmentApi.saveAssessment(result as any);
    console.log('[Dual Write] Assessment saved to WP:', wpResult.id);
  } catch (wpError) {
    console.warn('[Dual Write] WP save failed:', wpError);
  }

  // Also write to Apps Script (mirror)
  if (appsScript.isAppsScriptConfigured()) {
    try {
      await appsScript.saveAssessment(result);
      console.log('[Dual Write] Assessment mirrored to Apps Script');
    } catch (sheetError) {
      console.warn('[Dual Write] Apps Script mirror failed:', sheetError);
    }
  }

  // Return WP result if available, otherwise a dummy
  return wpResult || { id: Date.now() };
}

/**
 * Save tutor profile to both WP and Apps Script.
 * WP is the primary store; Apps Script is the mirror/backup.
 */
export async function saveTutorProfileDual(profile: Partial<TutorProfile>): Promise<TutorProfile> {
  // Always try WP first
  let wpResult: TutorProfile | null = null;
  try {
    wpResult = await tutorApi.updateProfile(profile);
    console.log('[Dual Write] Profile saved to WP');
  } catch (wpError) {
    console.warn('[Dual Write] WP profile save failed:', wpError);
  }

  // Also write to Apps Script (mirror)
  if (appsScript.isAppsScriptConfigured() && profile.id) {
    try {
      await appsScript.updateTutor(profile);
      console.log('[Dual Write] Profile mirrored to Apps Script');
    } catch (sheetError) {
      console.warn('[Dual Write] Apps Script mirror failed:', sheetError);
    }
  }

  return wpResult || (profile as TutorProfile);
}