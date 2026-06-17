import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TutorProfile, OnboardingStep, VerificationStatus, GamificationProfile } from '@/types/tutor';
import { authApi, tutorApi, adminApi, catalogueApi, setToken, getToken, clearToken, ApiError } from '@/lib/api';

interface AuthContextType {
  user: TutorProfile | null;
  isAdmin: boolean;
  allTutors: TutorProfile[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: Partial<TutorProfile> & { password: string; accountType: 'academic' | 'skill' }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<TutorProfile>) => Promise<void>;
  advanceStep: (step: OnboardingStep) => Promise<void>;
  verifyTutor: (tutorId: string, status: VerificationStatus, notes?: string) => Promise<void>;
  nudgeTutor: (tutorId: string, message?: string) => Promise<void>;
  deleteTutor: (tutorId: string) => Promise<void>;
  refreshTutors: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateTutorAdmin: (tutorId: string, data: Partial<TutorProfile>) => void;
  updateSettings: (data: Partial<{ whatsappNumber: string; contactEmail: string; commissionRate: number; portalNotice: string; showSkillsCatalogue: boolean; showAcademicsCatalogue: boolean }>) => void;
  settings: { whatsappNumber: string; contactEmail: string; commissionRate: number; portalNotice: string; showSkillsCatalogue: boolean; showAcademicsCatalogue: boolean };
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Mock data for local development when WP API is unavailable ──
const USE_MOCK = !import.meta.env.VITE_WP_API_URL;

const MOCK_TUTORS: TutorProfile[] = [
  {
    id: '1', email: 'ade@example.com', firstName: 'Adekunle', lastName: 'Johnson',
    phone: '+234 801 234 5678', location: 'Lagos', qualification: 'B.Sc Mathematics',
    subjects: ['Mathematics', 'Further Mathematics'], experience: 5, hourlyRate: 15000,
    briefIntro: 'Passionate math tutor with 5 years experience preparing students for WAEC and JAMB.',
    preferredLevels: ['Senior Secondary', 'Undergraduates'], currentWork: 'Secondary School Teacher',
    availability: 'Weekends, Evenings', teachingHistory: '3 schools, 200+ students',
    classDelivery: 'I use a mix of whiteboard sessions, practice problems, and real-world applications. Each class starts with a review of the previous topic and ends with a mini-quiz to track progress.',
    classType: 'hybrid', trcnCertified: true,
    rating: 4.7, reviewCount: 12,
    reviews: [
      { id: 'r1', reviewerName: 'Mrs. Adebayo', rating: 5, comment: "Adekunle transformed my son's understanding of mathematics. He went from a D to an A in WAEC!", date: '2025-02-10' },
      { id: 'r2', reviewerName: 'Mr. Ogundimu', rating: 4, comment: 'Very patient and methodical. My daughter now loves maths. Highly recommend.', date: '2025-01-18' },
      { id: 'r3', reviewerName: 'Funke A.', rating: 5, comment: 'Best maths tutor in Lagos. Worth every naira.', date: '2024-12-05' },
    ],
    availabilitySlots: [
      { day: 'Monday', startTime: '16:00', endTime: '19:00' },
      { day: 'Wednesday', startTime: '16:00', endTime: '19:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '14:00' },
      { day: 'Sunday', startTime: '10:00', endTime: '13:00' },
    ],
    isVerified: true, onboardingStep: 'verification', createdAt: '2025-01-15',
    gamification: { points: 450, badges: ['profile_complete', 'first_module', 'verified', 'five_star'], completedModules: ['welcome', 'class-delivery'], tutorOfTheMonth: true, tutorOfTheMonthDate: '2025-03' },
  },
  {
    id: '2', email: 'ngozi@example.com', firstName: 'Ngozi', lastName: 'Okafor',
    phone: '+234 802 345 6789', location: 'Abuja', qualification: 'M.Sc English Literature',
    subjects: ['English', 'Literature'], experience: 8, hourlyRate: 20000,
    briefIntro: 'English language specialist helping students excel in comprehension and essay writing.',
    preferredLevels: ['Junior Secondary', 'Senior Secondary'], currentWork: 'University Lecturer',
    availability: 'Flexible', teachingHistory: '8 years private tutoring',
    classDelivery: 'I focus on interactive reading and writing workshops. Students engage in discussions, peer reviews, and structured essay-writing exercises.',
    classType: 'virtual', trcnCertified: true,
    rating: 4.9, reviewCount: 23,
    reviews: [
      { id: 'r4', reviewerName: 'Dr. Emeka', rating: 5, comment: "Ngozi is exceptional. My children's English improved dramatically within 3 months.", date: '2025-03-01' },
      { id: 'r5', reviewerName: 'Amina K.', rating: 5, comment: 'Very articulate and engaging. Classes are never boring!', date: '2025-02-14' },
    ],
    availabilitySlots: [
      { day: 'Tuesday', startTime: '17:00', endTime: '20:00' },
      { day: 'Thursday', startTime: '17:00', endTime: '20:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '15:00' },
    ],
    isVerified: true, onboardingStep: 'verification', createdAt: '2024-11-20',
    gamification: { points: 600, badges: ['profile_complete', 'first_module', 'all_modules', 'verified'], completedModules: ['welcome', 'class-delivery', 'assessment-guide', 'parent-comms'], tutorOfTheMonth: false },
  },
  {
    id: '3', email: 'chidi@example.com', firstName: 'Chidi', lastName: 'Nwankwo',
    phone: '+234 803 456 7890', location: 'Port Harcourt', qualification: 'B.Sc Physics',
    subjects: ['Physics', 'Mathematics'], experience: 3, hourlyRate: 10000,
    briefIntro: 'Making physics fun and relatable for secondary school students.',
    preferredLevels: ['Senior Secondary'], currentWork: 'Freelance Tutor',
    availability: 'Weekdays', teachingHistory: '50+ students tutored',
    classDelivery: 'Hands-on experiments and visual demonstrations. I bring physics to life with everyday examples and YouTube video breakdowns.',
    classType: 'offline', trcnCertified: false,
    rating: 4.2, reviewCount: 6,
    reviews: [
      { id: 'r6', reviewerName: 'Blessing O.', rating: 4, comment: 'Chidi makes physics interesting. My son actually looks forward to class now.', date: '2025-02-20' },
    ],
    availabilitySlots: [
      { day: 'Monday', startTime: '10:00', endTime: '15:00' },
      { day: 'Tuesday', startTime: '10:00', endTime: '15:00' },
      { day: 'Friday', startTime: '10:00', endTime: '15:00' },
    ],
    isVerified: false, onboardingStep: 'verification', createdAt: '2025-03-01',
    gamification: { points: 100, badges: ['profile_complete'], completedModules: ['welcome'] },
  },
];

const ADMIN_EMAIL = 'admin@zanetutors.com.ng';
const MOCK_DATA_VERSION = '3';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TutorProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    whatsappNumber: '2348108325024',
    contactEmail: 'admin@zanetutors.com.ng',
    commissionRate: 30,
    portalNotice: 'Welcome to the Zane Tutor Portal!',
    showSkillsCatalogue: true,
    showAcademicsCatalogue: true
  });
  const [allTutors, setAllTutors] = useState<TutorProfile[]>(() => {
    if (USE_MOCK) {
      const savedVersion = localStorage.getItem('zane_tutors_version');
      if (savedVersion !== MOCK_DATA_VERSION) {
        localStorage.removeItem('zane_tutors');
        localStorage.setItem('zane_tutors_version', MOCK_DATA_VERSION);
        return MOCK_TUTORS;
      }
      const saved = localStorage.getItem('zane_tutors');
      return saved ? JSON.parse(saved) : MOCK_TUTORS;
    }
    return [];
  });

  // Persist mock data
  useEffect(() => {
    if (USE_MOCK) {
      localStorage.setItem('zane_tutors', JSON.stringify(allTutors));
    }
  }, [allTutors]);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      // Always fetch global settings
      try {
        const s = await catalogueApi.getSettings();
        setSettings(prev => ({ ...prev, ...s }));
      } catch (e) {
        console.error("Failed to load settings", e);
      }

      const savedSettings = localStorage.getItem('zane_portal_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse saved portal settings', e);
        }
      }

      if (USE_MOCK) {
        const saved = localStorage.getItem('zane_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setIsAdmin(parsed.email === ADMIN_EMAIL);
        }
        setLoading(false);
        return;
      }

      const token = getToken();
      if (!token) { setLoading(false); return; }

      try {
        const profile = await tutorApi.getProfile();
        setUser(profile);
        // Check admin by trying to load admin endpoint
        try {
          await adminApi.getAllTutors();
          setIsAdmin(true);
        } catch { setIsAdmin(false); }
      } catch {
        clearToken();
      }
      setLoading(false);
    };
    restore();
  }, []);

  // Persist mock user
  useEffect(() => {
    if (USE_MOCK) {
      if (user) localStorage.setItem('zane_current_user', JSON.stringify(user));
      else localStorage.removeItem('zane_current_user');
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    if (USE_MOCK) {
      if (email === ADMIN_EMAIL) {
        const adminUser: TutorProfile = { id: 'admin', email: ADMIN_EMAIL, firstName: 'Admin', lastName: '', phone: '', location: '', qualification: '', subjects: [], experience: 0, hourlyRate: 0, briefIntro: '', preferredLevels: [], currentWork: '', availability: '', teachingHistory: '', isVerified: true, onboardingStep: 'verification', createdAt: '' };
        setUser(adminUser);
        setIsAdmin(true);
        return { success: true };
      }
      const tutor = allTutors.find(t => t.email === email);
      if (tutor) { setUser(tutor); setIsAdmin(false); return { success: true }; }
      return { success: false, error: 'Invalid email or password.' };
    }

    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      setUser(res.user);
      setIsAdmin(res.is_admin);
      return { success: true };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      return { success: false, error: msg };
    }
  }, [allTutors]);

  const signup = useCallback(async (data: Partial<TutorProfile> & { password: string; accountType: 'academic' | 'skill' }) => {
    if (USE_MOCK) {
      if (allTutors.find(t => t.email === data.email)) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      const newTutor: TutorProfile = {
        id: Date.now().toString(), email: data.email || '', firstName: data.firstName || '',
        lastName: data.lastName || '', phone: data.phone || '', location: data.location || '',
        qualification: '', subjects: [], experience: 0, hourlyRate: 0, briefIntro: '',
        preferredLevels: [], currentWork: '', availability: '', teachingHistory: '',
        isVerified: false, onboardingStep: 'profile',
        createdAt: new Date().toISOString().split('T')[0],
        accountType: data.accountType,
        portalIntent: data.portalIntent,
        lmsTeachingTrack: data.lmsTeachingTrack,
        roles: data.roles || (data.portalIntent === 'lms' ? ['um_creator'] : undefined),
      };
      setAllTutors(prev => [...prev, newTutor]);
      setUser(newTutor);
      setIsAdmin(false);
      return { success: true };
    }

    try {
      const res = await authApi.signup({
        email: data.email || '',
        password: data.password,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        location: data.location || '',
        accountType: data.accountType,
        portalIntent: data.portalIntent,
        lmsTeachingTrack: data.lmsTeachingTrack,
      });
      setToken(res.token);
      setUser(res.user);
      setIsAdmin(false);
      return { success: true };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Signup failed. Please try again.';
      return { success: false, error: msg };
    }
  }, [allTutors]);

  const logout = useCallback(() => {
    setUser(null);
    setIsAdmin(false);
    clearToken();
  }, []);

  const updateProfile = useCallback(async (data: Partial<TutorProfile>) => {
    if (USE_MOCK) {
      if (!user) return;
      const updated = { ...user, ...data };
      setUser(updated);
      setAllTutors(prev => prev.map(t => t.id === user.id ? updated : t));
      return;
    }
    const updated = await tutorApi.updateProfile(data);
    setUser(updated);
  }, [user]);

  const advanceStep = useCallback(async (step: OnboardingStep) => {
    if (USE_MOCK) {
      if (!user) return;
      const updated = { ...user, onboardingStep: step };
      setUser(updated);
      setAllTutors(prev => prev.map(t => t.id === user.id ? updated : t));
      return;
    }
    await tutorApi.advanceStep(step);
    if (user) setUser({ ...user, onboardingStep: step });
  }, [user]);

  const verifyTutor = useCallback(async (tutorId: string, status: VerificationStatus, notes?: string) => {
    if (USE_MOCK) {
      setAllTutors(prev => prev.map(t => t.id === tutorId ? {
        ...t, verificationStatus: status, isVerified: status === 'approved',
        adminNotes: notes || t.adminNotes,
      } : t));
      return;
    }
    await adminApi.verifyTutor(tutorId, status, notes);
    setAllTutors(prev => prev.map(t => t.id === tutorId ? {
      ...t, verificationStatus: status, isVerified: status === 'approved',
      adminNotes: notes || t.adminNotes,
    } : t));
  }, []);

  const nudgeTutor = useCallback(async (tutorId: string, message?: string) => {
    if (USE_MOCK) {
      setAllTutors(prev => prev.map(t => t.id === tutorId ? { ...t, lastNudgedAt: new Date().toISOString() } : t));
      return;
    }
    await adminApi.nudgeTutor(tutorId);
    setAllTutors(prev => prev.map(t => t.id === tutorId ? { ...t, lastNudgedAt: new Date().toISOString() } : t));
  }, []);

  const updateTutorAdmin = useCallback((tutorId: string, data: Partial<TutorProfile>) => {
    setAllTutors(prev => prev.map(t => t.id === tutorId ? { ...t, ...data } : t));
  }, []);

  const updateSettings = useCallback((data: Partial<{ whatsappNumber: string; contactEmail: string; commissionRate: number; portalNotice: string; showSkillsCatalogue: boolean; showAcademicsCatalogue: boolean }>) => {
    setSettings(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('zane_portal_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTutor = useCallback(async (tutorId: string) => {
    if (USE_MOCK) {
      setAllTutors(prev => prev.filter(t => t.id !== tutorId));
      return;
    }
    await adminApi.deleteTutor(tutorId);
    setAllTutors(prev => prev.filter(t => t.id !== tutorId));
  }, []);

  const refreshTutors = useCallback(async () => {
    if (USE_MOCK) return;
    try {
      const tutors = isAdmin ? await adminApi.getAllTutors() : await catalogueApi.getTutors();
      setAllTutors(tutors);
    } catch (err) {
      console.error('Failed to refresh tutors:', err);
    }
  }, [isAdmin]);

  const refreshProfile = useCallback(async () => {
    if (USE_MOCK) return;
    try {
      const profile = await tutorApi.getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAdmin, allTutors, loading,
      login, signup, logout, updateProfile, advanceStep,
      verifyTutor, nudgeTutor, deleteTutor, refreshTutors, refreshProfile, updateTutorAdmin,
      updateSettings, settings
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
