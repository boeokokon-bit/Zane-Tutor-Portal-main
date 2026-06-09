import { AssessmentResult, SUBJECT_LABELS } from '@/types/assessment';
import * as appsScript from './appsScriptApi';

// ── Legacy Google Sheets script URL (kept for backward compatibility) ──
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkGtWOjM05FKb9ESSGr5-JynU9K0g0SAzmLjTta2tLLBb_OVwptMUuXkPyE0EGLQ8/exec';

// Track sent submissions to prevent duplicates
const sentSubmissions = new Set<string>();

const getSubmissionKey = (result: AssessmentResult): string => {
  return `${result.studentInfo.email}_${result.finalReadinessScore}_${Date.now()}`;
};

/**
 * Save assessment to the legacy Google Sheets script AND the new Apps Script layer.
 * 
 * Flow:
 *   1. Save to legacy Google Script (no-cors POST, kept for backward compat)
 *   2. Save to Apps Script (structured multi-tab storage)
 *   3. Both are fire-and-forget — assessment results in the app are the source of truth
 */
export const saveToGoogleSheets = async (result: AssessmentResult, downloadEmail?: string) => {
  const key = `${result.studentInfo.email}_${result.finalReadinessScore}`;
  if (sentSubmissions.has(key)) {
    console.log('⏭️ Skipping duplicate Google Sheets submission');
    return true;
  }
  sentSubmissions.add(key);

  const subjectResults = result.subjectResults || [];
  
  const payload = {
    tutorName: `${result.studentInfo.firstName} ${result.studentInfo.lastName}`.trim(),
    email: result.studentInfo.email,
    whatsapp: result.studentInfo.whatsappNumber,
    overallScore: result.finalReadinessScore,
    overallPassed: result.overallPassed ? 'Yes' : 'No',
    readinessLevel: result.readinessLevel,
    subjects: subjectResults.map(s => ({
      name: SUBJECT_LABELS[s.subject],
      score: s.percentage,
      passed: s.passed ? 'Yes' : 'No',
    })),
    yearsExperience: result.studentInfo.yearsExperience,
    educationLevel: result.studentInfo.educationLevel,
  };
  
  console.log('📤 Payload to Google Sheets:', payload);
  
  // ── 1. Legacy Google Script (fire-and-forget) ──
  let legacySuccess = false;
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    console.log('✅ Saved to legacy Google Sheets script');
    legacySuccess = true;
  } catch (error) {
    console.error('❌ Failed to save to legacy script:', error);
  }

  // ── 2. Apps Script (structured multi-tab storage) ──
  let appsScriptSuccess = false;
  if (appsScript.isAppsScriptConfigured()) {
    try {
      await appsScript.saveAssessment(result);
      console.log('✅ Saved to Apps Script (multi-tab sheet)');
      appsScriptSuccess = true;
    } catch (error) {
      console.error('❌ Failed to save to Apps Script:', error);
    }
  }

  // Return true if at least one succeeded
  return legacySuccess || appsScriptSuccess;
};
