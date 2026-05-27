import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LOCATIONS, LmsTeachingTrack } from '@/types/tutor';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { Loader2, Package, Calendar, Rocket, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', location: '',
    accountType: 'academic' as 'academic' | 'skill',
    portalIntent: 'teach' as 'teach' | 'lms',
    lmsTeachingTrack: 'general' as LmsTeachingTrack,
  });

  useEffect(() => {
    // Simulate app initialization load
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(loginForm.email, loginForm.password);
    setSubmitting(false);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Invalid credentials.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.firstName || !signupForm.email || !signupForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    const result = await signup({ 
      ...signupForm, 
      password: signupForm.password, 
      accountType: signupForm.accountType,
      portalIntent: signupForm.portalIntent,
      lmsTeachingTrack: signupForm.lmsTeachingTrack,
    });
    setSubmitting(false);
    if (result.success) {
      toast.success("Account created! Let's complete your profile.");
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Signup failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Loading Zane Tutor Portal...</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Connecting to learning hub and preparing your onboarding experience</p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/20 to-muted/10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo variant="chrome" imgClassName="w-8 h-8" textClassName="font-bold text-lg" />
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">Tutor Onboarding Portal</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Login/Signup Forms */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Log in to continue your onboarding</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="you@example.com" value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))} />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</> : 'Log In'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Join as a Tutor</CardTitle>
                    <CardDescription>Create your account to start onboarding</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label>My Primary Goal *</Label>
                        <Select
                          value={signupForm.portalIntent}
                          onValueChange={v => setSignupForm(p => ({
                            ...p,
                            portalIntent: v as 'teach' | 'lms',
                            lmsTeachingTrack: v === 'lms' ? p.lmsTeachingTrack : 'general',
                          }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="What is your goal?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teach">🚀 Teach with Zane (Join the Catalogue)</SelectItem>
                            <SelectItem value="lms">💻 Use Classes LMS (Manage my own classes)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {signupForm.portalIntent === 'lms' && (
                        <div className="space-y-2">
                          <Label>How will you use Classes LMS? *</Label>
                          <Select value={signupForm.lmsTeachingTrack} onValueChange={v => setSignupForm(p => ({ ...p, lmsTeachingTrack: v as LmsTeachingTrack }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select LMS setup" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">Use LMS only - no academic certification needed</SelectItem>
                              <SelectItem value="academic">Use LMS and teach academic subjects</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>I want to join as *</Label>
                        <Select value={signupForm.accountType} onValueChange={v => setSignupForm(p => ({ ...p, accountType: v as any }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select path" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="academic">📚 Academic Tutor (Math, English, etc.)</SelectItem>
                            <SelectItem value="skill">🎨 Skills Expert (AI, Baking, Fashion, etc.)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>First Name *</Label>
                          <Input placeholder="Adekunle" value={signupForm.firstName} onChange={e => setSignupForm(p => ({ ...p, firstName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input placeholder="Johnson" value={signupForm.lastName} onChange={e => setSignupForm(p => ({ ...p, lastName: e.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" placeholder="you@example.com" value={signupForm.email} onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input placeholder="+234 801 234 5678" value={signupForm.phone} onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Select value={signupForm.location} onValueChange={v => setSignupForm(p => ({ ...p, location: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select your location" /></SelectTrigger>
                          <SelectContent>
                            {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Password *</Label>
                        <Input type="password" placeholder="Min 6 characters" value={signupForm.password} onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))} />
                      </div>
                      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Account'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-sm text-muted-foreground">
              <p>
                By using this portal, you agree to our <Link className="text-primary underline" to="/terms">Terms of Use</Link> and <Link className="text-primary underline" to="/privacy">Privacy Policy</Link>.
              </p>
            </div>
          </div>

          {/* Right: Informational Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Section */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Configure Your Earning Channels</h2>
              <p className="text-base text-muted-foreground max-w-xl">
                Zane is a platform, not just a product. Explore the ways you can monetize your expertise. You can activate multiple tracks simultaneously.
              </p>
            </div>

            {/* Earning Tracks Cards */}
            <div className="space-y-4">
              {/* Card 1: Monthly Structured Tutors */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">📦</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Monthly Hourly Packages</CardTitle>
                      <CardDescription>For predictable, recurring income</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground">
                    You are assigned to students for fixed monthly blocks (e.g., 24-hour packages). Perfect for long-term home or virtual tutoring across our designated districts.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Earning Tiers</p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> <span>Standard Track (Primary & Lower Secondary)</span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> <span>Premium Track (JAMB, WAEC, Checkpoint)</span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> <span>Elite Track (IGCSE, SAT, A-Levels)</span></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: On-Demand Catalogue Booking */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">🗓️</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Public Catalogue Booking</CardTitle>
                      <CardDescription>Maximum flexibility & control</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground">
                    Set your own hourly price and list your open availability. Parents and adult learners can instantly discover your profile and book open calendar slots. Payments are cleared immediately upon session verification.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Benefits</p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> <span>100% control over rates & availability</span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> <span>Instant parent discovery</span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> <span>Real-time payment clearing</span></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Cohort Hub Creator */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">🚀</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Scalable L-Series Cohorts (LMS)</CardTitle>
                      <CardDescription>For educators & school owners</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground">
                    Launch your own digital campus. Set a fixed seat price and run live, interactive courses for small groups (L5, L10, L20). Zane handles the automated payment splits and provisions your custom Google Workspace tools.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">What You Get</p>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> <span>Automated payment & seat provisioning</span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> <span>Custom Google Workspace integration</span></li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> <span>Scale group learning easily</span></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* The Zane Earning Promise */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/2 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-primary">✨ The Zane Earning Promise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-foreground">No Chasing Payments</p>
                  <p className="text-sm text-muted-foreground">All fees—whether monthly plans, catalogue bookings, or cohort enrollments—are collected by Zane upfront. Your earnings dashboard updates in real time.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-foreground">Verifiable Payouts</p>
                  <p className="text-sm text-muted-foreground">Request direct bank transfers straight to your Nigerian bank account as soon as your milestone hours or live cohort sessions are verified by our system logs.</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-foreground">Grow Your Value</p>
                  <p className="text-sm text-muted-foreground">As your tracking metrics (attendance consistency, real-time quiz performance, client ratings) increase, your profile unlocks premium catalogue placements and higher-tier assignments automatically.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
