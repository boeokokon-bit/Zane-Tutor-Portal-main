import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, LOCATIONS, LEVELS, PRICING_RANGES, CLASS_TYPES, TutorProfile } from '@/types/tutor';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { catalogueApi } from '@/lib/api';
import { toast } from 'sonner';
import { GraduationCap, Search, X } from 'lucide-react';
import TutorCard from '@/components/catalogue/TutorCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Crown, BookOpen } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function Catalogue() {
  const { allTutors, user, refreshTutors, settings } = useAuth();

  useEffect(() => {
    refreshTutors();
  }, [refreshTutors]);

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState('');
  const [pricing, setPricing] = useState('');
  const [verification, setVerification] = useState('');
  const [classType, setClassType] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'academic' | 'skills') || (settings?.showAcademicsCatalogue ? 'academic' : 'skills');
  const [activeTab, setActiveTab] = useState<'academic' | 'skills'>(initialTab);
  
  useEffect(() => {
    if (settings) {
      const tabParam = searchParams.get('tab');
      if (!tabParam) {
        if (settings.showAcademicsCatalogue && !settings.showSkillsCatalogue) {
          setActiveTab('academic');
        } else if (!settings.showAcademicsCatalogue && settings.showSkillsCatalogue) {
          setActiveTab('skills');
        } else {
          setActiveTab(settings.showAcademicsCatalogue ? 'academic' : 'skills');
        }
      }
    }
  }, [settings]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'academic' || tabParam === 'skills') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    const newTab = val as 'academic' | 'skills';
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const filtered = useMemo(() => {
    return allTutors.filter(t => {
      if (t.portalIntent !== 'teach') return false;

      // Role-based categorization
      const isSkillExpert = t.roles?.some(r => ['teacher', 'top_rated_teacher', 'um_subscribe-t'].includes(r));
      const isAcademic = !isSkillExpert;

      if (activeTab === 'academic' && !isAcademic) return false;
      if (activeTab === 'skills' && !isSkillExpert) return false;

      // In the catalogue, we only show verified tutors or those who have reached the verification stage
      if (!t.isVerified && t.onboardingStep !== 'verification' && !t.roles?.includes('top_rated_teacher')) return false;
      if (t.hiddenFromCatalogue) return false;
      const q = search.toLowerCase();
      const firstName = t.firstName || '';
      const subjects = t.subjects || [];
      const locationVal = t.location || '';
      
      const searchMatch = !q || firstName.toLowerCase().includes(q) ||
        subjects.some(s => s.toLowerCase().includes(q)) ||
        locationVal.toLowerCase().includes(q);
      const subjectMatch = !subject || t.subjects.includes(subject);
      const locationMatch = !location || t.location === location;
      const levelMatch = !level || t.preferredLevels.includes(level);
      let pricingMatch = true;
      if (pricing) {
        const [min, max] = pricing.split('-').map(Number);
        pricingMatch = max ? (t.hourlyRate >= min && t.hourlyRate <= max) : t.hourlyRate >= min;
      }
      const verMatch = !verification ||
        (verification === 'verified' && t.isVerified) ||
        (verification === 'unverified' && !t.isVerified);
      const classMatch = !classType || t.classType === classType;
      return searchMatch && subjectMatch && locationMatch && levelMatch && pricingMatch && verMatch && classMatch;
    });
  }, [allTutors, search, subject, location, level, pricing, verification, classType]);

  const clearFilters = () => {
    setSearch(''); setSubject(''); setLocation('');
    setLevel(''); setPricing(''); setVerification(''); setClassType('');
  };

  const hasFilters = search || subject || location || level || pricing || verification || classType;

  // Quick-match (hero) form state
  const QUICK_MATCH_OPTIONS = [
    'NCEE', 'BECE', 'WAEC', 'NECO', 'JAMB', 'IELTS', 'Learning Support', 'Tech/Coding', 'Skills', 'Other'
  ];
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [childOption, setChildOption] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  const submitQuickMatch = async () => {
    if (!parentName.trim()) return toast.error('Please enter your name');
    if (!parentPhone.trim()) return toast.error('Please enter your phone number');
    if (!childOption) return toast.error('Please select the child\'s class/exam');

    setQuickLoading(true);
    try {
      await catalogueApi.submitLead({
        tutorId: '',
        tutorName: 'Quick Match',
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim(),
        parentPhone: parentPhone.trim(),
        message: `Quick match: ${childOption}`,
      });
      toast.success('Thanks — we received your request. We will match you shortly.');
      setParentName(''); setParentEmail(''); setParentPhone(''); setChildOption('');
    } catch (err) {
      toast.error('Failed to submit. Please try again later.');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Zane Tutors</p>
              <h1 className="text-lg font-semibold text-slate-900">Discover Trusted Tutors</h1>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {settings?.showAcademicsCatalogue && (
              <Button
                variant={activeTab === 'academic' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleTabChange('academic')}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" /> Academic
              </Button>
            )}
            {settings?.showSkillsCatalogue && (
              <Button
                variant={activeTab === 'skills' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleTabChange('skills')}
                className="gap-2"
              >
                <Crown className="w-4 h-4" /> Skills
              </Button>
            )}
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm">Become a Tutor</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] bg-gradient-to-r from-primary to-secondary p-8 text-white shadow-[0_32px_80px_-40px_rgba(14,165,233,0.55)]">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.28em] text-white/80">Catalogue</p>
                <h2 className="text-4xl font-semibold leading-tight">Find the right tutor for every goal.</h2>
                <p className="max-w-3xl text-sm text-white/90 leading-7">
                  Filter by subject, level, location, and verification status to match with tutors who are ready to support your child’s learning journey.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Showing</p>
                  <p className="mt-3 text-3xl font-semibold">{filtered.length}</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Focus</p>
                  <p className="mt-3 text-3xl font-semibold">{activeTab === 'academic' ? 'Academic' : 'Skills'}</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Quick match</p>
                  <p className="mt-3 text-3xl font-semibold">Instant request</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] bg-white shadow-xl border border-slate-200 p-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Search tutors</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Refine your match</h3>
                  </div>
                  <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>Reset filters</Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Search</label>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Name, subject, location"
                        className="pl-10"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Subject</label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Level</label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                      <SelectContent>
                        {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Location</label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Price</label>
                    <Select value={pricing} onValueChange={setPricing}>
                      <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
                      <SelectContent>
                        {PRICING_RANGES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Filters</label>
                    <div className="grid gap-2">
                      <Select value={verification} onValueChange={setVerification}>
                        <SelectTrigger><SelectValue placeholder="Verification" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified Only</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={classType} onValueChange={setClassType}>
                        <SelectTrigger><SelectValue placeholder="Class Type" /></SelectTrigger>
                        <SelectContent>
                          {CLASS_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div id="quick-match" className="rounded-[2rem] bg-white shadow-xl border border-slate-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Quick Match</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">Need an expert fast?</h3>
                  </div>
                  <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Contact our team</Button>
                </div>
                <div className="mt-4 grid gap-4">
                  <label className="text-sm font-medium text-slate-700">Your Name</label>
                  <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="e.g. Mr. Ahmed" />

                  <label className="text-sm font-medium text-slate-700">Child's Class / Exam</label>
                  <Select value={childOption} onValueChange={setChildOption}>
                    <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                    <SelectContent>
                      {QUICK_MATCH_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Phone Number</label>
                      <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="e.g. 08012345678" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Email (optional)</label>
                      <Input value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="you@domain.com" />
                    </div>
                  </div>

                  <Button className="mt-2" onClick={submitQuickMatch} disabled={quickLoading}>
                    {quickLoading ? 'Sending…' : 'Request an Expert Match'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2rem] bg-white shadow-xl border border-slate-200 p-6 sticky top-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Need guidance?</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Let us help you choose</h2>
              <p className="mt-3 text-sm text-slate-600">If you’re not sure which tutor is best, request a quick match and we’ll recommend one based on your student’s needs.</p>
              <div className="mt-5 grid gap-3">
                <Button onClick={() => document.getElementById('quick-match')?.scrollIntoView({ behavior: 'smooth' })}>Request a match</Button>
                <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>Reset filters</Button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-900 text-white shadow-xl border border-white/10 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Why Zane Tutors</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />Verified tutors only</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary" />Fast matching and booking</li>
                <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />Student-approved teaching styles</li>
              </ul>
            </div>
          </aside>
        </div>

        <section className="mt-10">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(t => (
                <TutorCard key={t.id} tutor={t} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl p-14 text-center">
              <GraduationCap className="mx-auto mb-4 h-14 w-14 text-slate-400" />
              <h3 className="text-2xl font-semibold mb-2">No tutors found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filters or request a quick match and we’ll recommend someone for you.</p>
              <Button variant="secondary" className="mt-6" onClick={() => document.getElementById('quick-match')?.scrollIntoView({ behavior: 'smooth' })}>Request a match</Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
