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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7" />
            <span className="font-bold text-lg">Zane Tutors</span>
          </Link>
          <div className="flex items-center gap-2">
            {settings?.showAcademicsCatalogue && (
              <Button
                variant={activeTab === 'academic' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleTabChange('academic')}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" /> Academic Tutors
              </Button>
            )}
            {settings?.showSkillsCatalogue && (
              <Button
                variant={activeTab === 'skills' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleTabChange('skills')}
                className="gap-2"
              >
                <Crown className="w-4 h-4" /> Skills Experts
              </Button>
            )}
            {user ? (
              <Link to="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="secondary" size="sm">Become a Tutor</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8">
          <div className="md:pr-6">
            <h1 className="text-4xl font-bold mb-2">Meet Your Growth Partners</h1>
            <p className="text-muted-foreground text-lg">Browse our roster of vetted academic architects and digital specialists. Every expert is backed by Zane’s diagnostic infrastructure to guarantee your success.</p>
          </div>

          <div>
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Quick Match — Request an Expert</h3>
                <p className="text-xs text-muted-foreground mb-3">No time to browse? Submit a few details and we’ll match you with the right tutor.</p>
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs text-muted-foreground">Your Name</label>
                  <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="e.g. Mr. Ahmed" />

                  <label className="text-xs text-muted-foreground">Child's Class / Exam</label>
                  <Select value={childOption} onValueChange={setChildOption}>
                    <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                    <SelectContent>
                      {QUICK_MATCH_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <label className="text-xs text-muted-foreground">Phone Number</label>
                  <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="e.g. 08012345678" />

                  <label className="text-xs text-muted-foreground">Email (optional)</label>
                  <Input value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="you@domain.com" />

                  <Button className="mt-2" onClick={submitQuickMatch} disabled={quickLoading}>
                    {quickLoading ? 'Sending…' : 'Request an Expert Match'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Catalogue Mode Tabs */}
        {(settings?.showAcademicsCatalogue && settings?.showSkillsCatalogue) && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="academic" className="gap-2">
                <BookOpen className="w-4 h-4" /> Academic Tutors
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <Crown className="w-4 h-4" /> Skills Experts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Search & Filters */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, subject, or location..."
                className="pl-10 h-12 text-base"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={pricing} onValueChange={setPricing}>
                <SelectTrigger><SelectValue placeholder="Price Range" /></SelectTrigger>
                <SelectContent>
                  {PRICING_RANGES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
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
            {hasFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">{filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" /> Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results - Vertical card grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(t => (
              <TutorCard key={t.id} tutor={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No tutors found matching your criteria.</p>
            <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
          </div>
        )}

        <section className="mt-16 rounded-3xl border border-primary/10 bg-primary/5 p-10 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-primary/70">Let Our Diagnostics Do the Matching</p>
          <h2 className="mt-4 text-3xl font-semibold">Don’t guess which expert fits your child’s learning style.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Let our Academic Fitness Index (AFI) pinpoint their exact cognitive gaps first, and we will automatically match you with the perfect specialist.
          </p>
          <Link to="/assessment" className="inline-flex mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
            Start Diagnostic Assessment
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
