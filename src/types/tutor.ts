export type OnboardingStep = 'signup' | 'profile' | 'test' | 'verification';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type ClassType = 'offline' | 'virtual' | 'hybrid';

export type AccountType = 'academic' | 'skill';

export type LmsTeachingTrack = 'general' | 'academic';

export interface PastProject {
  title: string;
  description: string;
  link?: string;
}

export interface TutorReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface DocUpload {
  fileName: string;
  uploadedAt: string;
  expiryDate?: string; // ISO date for IDs
}

export interface GamificationProfile {
  points: number;
  badges: string[];
  completedModules: string[];
  tutorOfTheMonth?: boolean;
  tutorOfTheMonthDate?: string;
}

export interface TutorProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  profilePhoto?: string;
  qualification: string;
  macroCategory?: string;
  subjects: string[];
  experience: number;
  hourlyRate: number;
  briefIntro: string;
  preferredLevels: string[];
  currentWork: string;
  availability: string;
  availabilitySlots?: AvailabilitySlot[];
  teachingHistory: string;
  classDelivery?: string;
  classType?: ClassType;
  trcnCertified?: boolean;
  rating?: number;
  reviewCount?: number;
  reviews?: TutorReview[];
  isVerified: boolean;
  verificationStatus?: VerificationStatus;
  adminNotes?: string;
  uploadedDocs?: Record<string, string>;
  uploadedDocsDetailed?: Record<string, DocUpload>;
  lastNudgedAt?: string;
  lastOnline?: string;
  profileViews?: number;
  hiddenFromCatalogue?: boolean;
  gamification?: GamificationProfile;
  onboardingStep: OnboardingStep;
  assessmentHistory?: { id: string; date: string; data: any }[];
  lastAssessmentScore?: number;
  createdAt: string;
  roles?: string[];
  accountType?: AccountType;
  pastProjects?: PastProject[];
  assignedLeads?: any[];

  // Extended fields from Forminator (Deep Intelligence)
  gender?: string;
  dob?: string;
  stateOfOrigin?: string;
  successStories?: string;
  currentWorkplace?: string;
  academicAchievements?: string;
  isCorpsMember?: boolean;
  portalIntent?: 'teach' | 'lms';
  lmsTeachingTrack?: LmsTeachingTrack;
  monthlyPlanOptIn?: boolean;
}

export const GAMIFICATION_BADGES: { id: string; label: string; description: string; icon: string; pointsRequired: number }[] = [
  { id: 'profile_complete', label: 'Profile Pro', description: 'Completed 100% of your profile', icon: '🏆', pointsRequired: 50 },
  { id: 'first_module', label: 'Quick Learner', description: 'Completed your first training module', icon: '📚', pointsRequired: 100 },
  { id: 'all_modules', label: 'Training Champion', description: 'Completed all training modules', icon: '🎓', pointsRequired: 500 },
  { id: 'verified', label: 'Verified Tutor', description: 'Successfully verified by Zane Tutors', icon: '✅', pointsRequired: 200 },
  { id: 'five_star', label: 'Five Star Tutor', description: 'Received a 5-star review', icon: '⭐', pointsRequired: 300 },
  { id: 'tutor_of_month', label: 'Tutor of the Month', description: 'Selected as Tutor of the Month', icon: '👑', pointsRequired: 1000 },
];

export const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'Computer Science', 'Economics',
  'Further Mathematics', 'Accounting', 'Literature',
  'AI literacy', 'Baking', 'Digital content creation', 
  'Fashion Design', 'Data analysis and visualization', 
  'Entrepreneurship basics', 'Marketing fundamentals', 
  'Foreign languages', 'Personal budgeting', 
  'Video Editing', 'Public speaking', 
  'Robotics fundamentals', 'Sustainable technologies'
];

export const LOCATIONS = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan',
  'Kano', 'Online/Flexible', 'Enugu', 'Akwa Ibom'
];

export const LEVELS = [
  'Lower Primary', 'Upper Primary', 'Junior Secondary',
  'Senior Secondary', 'Undergraduate', 'Postgraduate', 'Adult Learner'
];

export const CLASS_TYPES: { value: ClassType; label: string; description: string }[] = [
  { value: 'offline', label: 'In-Person', description: 'Physical, face-to-face classes' },
  { value: 'virtual', label: 'Virtual', description: 'Online/remote classes' },
  { value: 'hybrid', label: 'Hybrid', description: 'Mix of in-person and virtual' },
];

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const PRICING_RANGES = [
  { value: '0-5000', label: '₦0 - ₦5,000' },
  { value: '5000-10000', label: '₦5,000 - ₦10,000' },
  { value: '10000-20000', label: '₦10,000 - ₦20,000' },
  { value: '20000-50000', label: '₦20,000 - ₦50,000' },
  { value: '50000-100000', label: '₦50,000 - ₦100,000' },
  { value: '100000+', label: '₦100,000+' },
];

export const ONBOARDING_STEPS: { key: OnboardingStep; label: string; description: string }[] = [
  { key: 'signup', label: 'Account Created', description: 'Sign up with your details' },
  { key: 'profile', label: 'Complete Profile', description: 'Teaching history & preferences' },
  { key: 'test', label: 'Take Assessment', description: 'Subject competency test' },
  { key: 'verification', label: 'Verification', description: 'Upload documents for review' },
];
