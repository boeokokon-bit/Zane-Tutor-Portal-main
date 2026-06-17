import { TutorProfile } from '@/types/tutor';
import { ACADEMIC_SUBJECTS, SKILL_SUBJECTS, LEVELS } from '@/types/tutor';

export type Lane =
  | 'academic_monthly'
  | 'academic_catalogue'
  | 'skills'
  | 'lms_creator'
  | 'lms_academic'
  | 'admin';

export type Requirement = 'required' | 'optional' | 'insight' | 'skip';

export interface AssessmentRequirements {
  subject: Requirement;
  digital: Requirement;
  psych: Requirement;
}

export interface DocRequirement {
  key: string;
  label: string;
  desc: string;
  level: 'required' | 'optional';
  needsExpiry?: boolean;
}

export const LANE_LABELS: Record<Lane, string> = {
  academic_monthly: 'Academic Tutor — Monthly Plan',
  academic_catalogue: 'Academic Tutor — Catalogue',
  skills: 'Skills Expert',
  lms_creator: 'LMS Creator',
  lms_academic: 'LMS Academic Creator',
  admin: 'Admin',
};

export function resolveLane(user: Partial<TutorProfile> | null | undefined): Lane {
  if (!user) return 'academic_catalogue';
  if (user.roles?.some(r => ['administrator', 'admin'].includes(r))) return 'admin';

  const isLMS = user.portalIntent === 'lms' || user.roles?.includes('um_creator');
  if (isLMS) {
    return user.lmsTeachingTrack === 'academic' ? 'lms_academic' : 'lms_creator';
  }

  const isSkill =
    user.accountType === 'skill' ||
    user.roles?.some(r => ['teacher', 'top_rated_teacher', 'um_subscribe-t'].includes(r));
  if (isSkill) return 'skills';

  return user.monthlyPlanOptIn ? 'academic_monthly' : 'academic_catalogue';
}

export function getRequiredAssessments(lane: Lane): AssessmentRequirements {
  switch (lane) {
    case 'academic_monthly':
      return { subject: 'required', digital: 'required', psych: 'required' };
    case 'academic_catalogue':
      return { subject: 'optional', digital: 'required', psych: 'insight' };
    case 'skills':
      return { subject: 'skip', digital: 'required', psych: 'required' };
    case 'lms_creator':
    case 'lms_academic':
      return { subject: 'skip', digital: 'insight', psych: 'insight' };
    case 'admin':
      return { subject: 'skip', digital: 'skip', psych: 'skip' };
  }
}

export function getRequiredDocs(lane: Lane): DocRequirement[] {
  const idDoc: DocRequirement = {
    key: 'id',
    label: 'Government-issued ID',
    desc: "NIN slip, International Passport, or Voter's Card",
    level: 'required',
    needsExpiry: true,
  };
  const certDoc: DocRequirement = {
    key: 'cert',
    label: 'Highest Certificate / Degree',
    desc: 'Degree certificate, transcript or relevant certification',
    level: 'required',
  };
  const portfolio: DocRequirement = {
    key: 'portfolio',
    label: 'Portfolio / Work Samples',
    desc: 'Links or files showing past skill-based work',
    level: 'required',
  };
  const guarantor: DocRequirement = {
    key: 'guarantor',
    label: "Guarantor's Form",
    desc: 'Signed guarantor form (required for monthly plan)',
    level: 'required',
  };
  const nysc: DocRequirement = {
    key: 'nysc',
    label: 'NYSC ID Card / State Code',
    desc: 'Required for active corps members on the monthly plan',
    level: 'required',
  };
  const ice: DocRequirement = {
    key: 'ice',
    label: 'In-Case-of-Emergency (ICE) Contact',
    desc: 'Upload a signed ICE contact sheet (name, phone, relationship)',
    level: 'required',
  };

  switch (lane) {
    case 'academic_monthly':
      return [idDoc, certDoc, guarantor, nysc, ice];
    case 'academic_catalogue':
      return [idDoc, certDoc, { ...ice, level: 'optional' }];
    case 'skills':
      return [idDoc, { ...certDoc, level: 'optional' }, portfolio];
    case 'lms_academic':
      return [idDoc, certDoc];
    case 'lms_creator':
      return [idDoc, { ...portfolio, level: 'optional', label: 'Portfolio (optional)' }];
    case 'admin':
      return [];
  }
}

export function isCatalogueVisible(user: Partial<TutorProfile>): boolean {
  if (user.hiddenFromCatalogue) return false;
  if (user.portalIntent === 'lms') return false;
  if (user.roles?.includes('um_creator')) return false;
  return !!user.isVerified;
}

export function laneNeedsAssessment(lane: Lane): boolean {
  const req = getRequiredAssessments(lane);
  // Any non-skip step means the assessment screen is meaningful
  return req.subject !== 'skip' || req.digital !== 'skip' || req.psych !== 'skip';
}

/**
 * Subject list a lane should pick from.
 * - Academic lanes (catalogue/monthly + lms_academic) → school subjects.
 * - Skills lane + lms_creator → skill-oriented subjects.
 */
export function getSubjectListForLane(lane: Lane): string[] {
  switch (lane) {
    case 'skills':
    case 'lms_creator':
      return SKILL_SUBJECTS;
    case 'academic_monthly':
    case 'academic_catalogue':
    case 'lms_academic':
      return ACADEMIC_SUBJECTS;
    case 'admin':
    default:
      return [...ACADEMIC_SUBJECTS, ...SKILL_SUBJECTS];
  }
}

/**
 * Whether school-grade levels (Lower Primary → Postgraduate) are meaningful
 * for this lane. Skills and LMS-creator lanes don't use them.
 */
export function laneUsesSchoolLevels(lane: Lane): boolean {
  return lane === 'academic_monthly' || lane === 'academic_catalogue' || lane === 'lms_academic';
}

export function getLevelListForLane(lane: Lane): string[] {
  return laneUsesSchoolLevels(lane) ? LEVELS : [];
}
