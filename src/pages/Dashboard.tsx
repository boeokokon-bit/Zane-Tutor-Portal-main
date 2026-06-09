import { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StepTracker from '@/components/onboarding/StepTracker';
import ProfileStep from '@/components/onboarding/ProfileStep';
import TestStep from '@/components/onboarding/TestStep';
import VerificationStep from '@/components/onboarding/VerificationStep';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { LogOut, Users, BookOpen, User, Laptop } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { resolveLane, getRequiredAssessments, LANE_LABELS } from '@/lib/lanes';

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

  const STEP_ORDER = ['signup', 'profile', 'test', 'verification'] as const;
  const currentStepIndex = STEP_ORDER.indexOf(user.onboardingStep as (typeof STEP_ORDER)[number]);
  const progressValue = currentStepIndex >= 0 ? Math.round(((currentStepIndex + 1) / STEP_ORDER.length) * 100) : 0;
  const currentPhase = isProfileEditMode ? 'Edit your profile' : user.onboardingStep === 'signup' ? 'Finish account setup' : user.onboardingStep === 'profile' ? 'Complete your profile' : user.onboardingStep === 'test' ? 'Complete your assessments' : 'Get verified and go live';

  return (
    <div className="min-h-screen bg-slate-950/5 text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl text-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="chrome" imgClassName="w-8 h-8" textClassName="font-bold text-lg" />
            </Link>
            <div className="hidden sm:block text-sm text-slate-600">Your profile control centre for teaching growth.</div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open('https://classes.zanetutors.com.ng', '_blank')} className="gap-2 hidden md:inline-flex">
              <Laptop className="w-4 h-4" /> Go to LMS
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tutor')} className="gap-2">
              <User className="w-4 h-4" /> Portal
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/training')} className="gap-2">
              <BookOpen className="w-4 h-4" /> Training
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/catalogue')} className="gap-2">
              <Users className="w-4 h-4" /> Catalogue
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }} className="gap-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.9fr]">
          <section className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-[0_35px_60px_-30px_rgba(14,165,233,0.75)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.32em] text-white/80">Tutor Dashboard</p>
                  <h1 className="text-4xl font-semibold leading-tight">Hello, {user.firstName}. Build a standout tutor profile.</h1>
                  <p className="max-w-2xl text-sm text-white/90 leading-7">
                    Continue your onboarding, update your profile, and launch your public catalogue listing with confidence.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 px-5 py-4 text-right ring-1 ring-white/20 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">Your lane</p>
                  <p className="mt-3 text-2xl font-semibold">{LANE_LABELS[lane]}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Next step</p>
                  <p className="mt-3 text-lg font-semibold">{currentPhase}</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Progress</p>
                  <p className="mt-3 text-lg font-semibold">{progressValue}% complete</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Status</p>
                  <p className="mt-3 text-lg font-semibold capitalize">{user.onboardingStep}</p>
                </div>
              </div>
            </div>

            {isLMSOnly && !isProfileEditMode && (
              <div className="rounded-[1.75rem] border border-slate-200/30 bg-white shadow-xl p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-primary">Optional Teaching Insight</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Create a stronger teaching profile</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Complete an optional insight assessment to receive feedback on your teaching style and strengthen your public profile without slowing your LMS workflow.
                    </p>
                  </div>
                  <Button size="lg" onClick={() => navigate('/assessment')}>
                    Take the optional insight
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Button size="lg" onClick={() => navigate('/dashboard?edit=profile')}>
                Edit your profile
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/catalogue')}>
                View public catalogue
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white shadow-lg p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Onboarding progress</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Where you are</h2>
                </div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {progressValue}%
                </div>
              </div>

              <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${progressValue}%` }} />
              </div>

              <div className="mt-6">
                <StepTracker currentStep={user.onboardingStep} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white shadow-lg p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Move ahead faster</h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Button size="md" onClick={() => navigate('/dashboard?edit=profile')}>Update profile details</Button>
                <Button variant="outline" size="md" onClick={() => navigate('/tutor')}>Open tutor portal</Button>
                <Button variant="outline" size="md" onClick={() => navigate('/training')}>Review training resources</Button>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10 rounded-[2rem] border border-slate-200/70 bg-white shadow-xl p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Current action</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{isProfileEditMode ? 'Profile editor' : 'Continue your onboarding'}</h2>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{currentPhase}</div>
          </div>
          {renderStep()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
