import { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StepTracker from '@/components/onboarding/StepTracker';
import ProfileStep from '@/components/onboarding/ProfileStep';
import TestStep from '@/components/onboarding/TestStep';
import VerificationStep from '@/components/onboarding/VerificationStep';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { GraduationCap, LogOut, Users, BookOpen, User, Laptop } from 'lucide-react';
import { resolveLane, laneNeedsAssessment, getRequiredAssessments, LANE_LABELS } from '@/lib/lanes';

export default function Dashboard() {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isProfileEditMode = searchParams.get('edit') === 'profile';

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login');
    else if (isAdmin) navigate('/admin');
  }, [user, isAdmin, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  const lane = resolveLane(user);
  const isLMSOnly = lane === 'lms_creator' || lane === 'lms_academic';
  const assessmentReq = getRequiredAssessments(lane);
  // Test step is only meaningful if at least one assessment section is required or optional (not insight/skip)
  const skipTestStep =
    isLMSOnly ||
    (assessmentReq.subject !== 'required' && assessmentReq.subject !== 'optional' &&
     assessmentReq.digital !== 'required' && assessmentReq.digital !== 'optional' &&
     assessmentReq.psych !== 'required' && assessmentReq.psych !== 'optional');

  const renderStep = () => {
    if (isProfileEditMode) return <ProfileStep />;

    // Skip test step if the lane doesn't need any required/optional assessments
    if (skipTestStep && user.onboardingStep === 'test') {
      return <VerificationStep />;
    }

    switch (user.onboardingStep) {
      case 'signup': 
      case 'profile': return <ProfileStep />;
      case 'test': return <TestStep />;
      case 'verification': return <VerificationStep />;
      default: return <ProfileStep />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo variant="chrome" imgClassName="w-8 h-8" textClassName="font-bold text-lg" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:block">Hi, {user.firstName}!</span>
            <Button variant="outline" size="sm" onClick={() => window.open('https://classes.zanetutors.com.ng', '_blank')} className="gap-1.5 hidden md:flex text-primary bg-background/90 hover:bg-background border-primary/20">
              <Laptop className="w-4 h-4" /> Go to LMS
            </Button>
            <Link to="/tutor">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
                <User className="w-4 h-4 mr-1" /> Portal
              </Button>
            </Link>
            <Link to="/training">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
                <BookOpen className="w-4 h-4 mr-1" /> Training
              </Button>
            </Link>
            <Link to="/catalogue">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
                <Users className="w-4 h-4 mr-1" /> Catalogue
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }} className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{isProfileEditMode ? 'Edit Your Profile' : 'Your Onboarding'}</h1>
          <p className="text-muted-foreground">
            {isProfileEditMode ? 'Update your tutor profile at any time and save your latest details.' : 'Complete all steps to appear on the tutor catalogue'}
          </p>
        </div>
        {isLMSOnly && !isProfileEditMode && (
          <div className="mb-6 rounded-3xl border border-primary/15 bg-primary/5 p-5 text-primary-foreground shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-primary/70">Optional Teaching Insight</p>
                <h2 className="text-xl font-semibold">Want a quick teaching profile?</h2>
                <p className="mt-2 text-sm text-primary/80">
                  Complete a short optional insight assessment to get feedback on your teaching style and psychology. This is not required to use the LMS — it helps you improve and build a stronger profile.
                </p>
              </div>
              <Link to="/assessment" className="shrink-0">
                <button className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
                  Take the optional insight
                </button>
              </Link>
            </div>
          </div>
        )}
        <StepTracker currentStep={user.onboardingStep} />

        <div className="mt-8">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
