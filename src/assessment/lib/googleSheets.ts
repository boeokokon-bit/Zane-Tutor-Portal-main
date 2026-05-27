import { AssessmentResult, SUBJECT_LABELS } from '@/assessment/types/assessment';

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || 'https://script.google.com/macros/s/AKfycbzkGtWOjM05FKb9ESSGr5-JynU9K0g0SAzmLjTta2tLLBb_OVwptMUuXkPyE0EGLQ8/exec';

// Track sent submissions to prevent duplicates
const sentSubmissions = new Set<string>();

const getSubmissionKey = (result: AssessmentResult): string => {
  return `${result.studentInfo.email}_${result.finalReadinessScore}_${Date.now()}`;
};

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
    psychResults: result.psychResults?.map(p => ({
      category: p.category,
      percentage: p.percentage,
      level: p.level
    })),
  };
  
  console.log('📤 Payload to Google Sheets:', payload);
  
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    console.log('✅ Saved to Google Sheets');
    return true;
  } catch (error) {
    console.error('❌ Failed to save:', error);
    return false;
  }
};
