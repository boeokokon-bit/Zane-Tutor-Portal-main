import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import StarRating from '@/components/catalogue/StarRating';
import { Logo } from '@/components/Logo';
import { ONBOARDING_STEPS, TutorProfile, OnboardingStep, VerificationStatus, GAMIFICATION_BADGES } from '@/types/tutor';
import { resolveLane, LANE_LABELS } from '@/lib/lanes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GraduationCap, LogOut, Users, CheckCircle, Clock, BookOpen, UserPlus,
  Search, Eye, EyeOff, ShieldCheck, ShieldX, Bell, Trash2, Filter, X, Mail,
  MapPin, Briefcase, Star, AlertTriangle, FileText, Phone, Trophy, Crown, Calendar, Send,
  Brain, Laptop
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, AssessmentSummary } from '@/lib/api';
import AssessmentHistoryCard from '@/components/assessment/dashboard/AssessmentHistoryCard';
import AssessmentDetailDialog from '@/components/assessment/dashboard/AssessmentDetailDialog';
import { Loader2 } from 'lucide-react';

const stepIcons: Record<string, React.ReactNode> = {
  signup: <UserPlus className="w-4 h-4" />,
  profile: <Clock className="w-4 h-4" />,
  test: <BookOpen className="w-4 h-4" />,
  verification: <CheckCircle className="w-4 h-4" />,
};

const stepColors: Record<string, string> = {
  signup: 'bg-muted text-muted-foreground',
  profile: 'bg-secondary/20 text-secondary-foreground',
  test: 'bg-accent/20 text-accent-foreground',
  verification: 'bg-primary/10 text-primary',
};

export default function AdminDashboard() {
  const { user, isAdmin, loading, allTutors, logout, verifyTutor, nudgeTutor, deleteTutor, updateTutorAdmin, refreshTutors } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshTutors();
  }, [refreshTutors]);

  const [search, setSearch] = useState('');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [tutorTypeFilter, setTutorTypeFilter] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tutorAssessments, setTutorAssessments] = useState<AssessmentSummary[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: 'approve' | 'reject' | 'delete' | 'nudge' | 'unverify' | 'hide' | 'totm'; tutor: TutorProfile } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (type: 'approve' | 'nudge' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    if (type === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.length} tutors?`)) return;

    try {
      for (const id of selectedIds) {
        if (type === 'approve') await verifyTutor(id, 'approved', 'Bulk approved');
        if (type === 'nudge') await nudgeTutor(id);
        if (type === 'delete') await deleteTutor(id);
      }
      toast.success(`Bulk action complete: processed ${selectedIds.length} tutors.`);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Bulk action failed");
    }
  };
  const [showStale, setShowStale] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const data = await adminApi.getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleForwardLead = async (tutorId: string, leadId: string) => {
    try {
      await adminApi.forwardLead(tutorId, leadId);
      toast.success('Lead forwarded to tutor!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to forward lead');
    }
  };

  const handleArchiveLead = async (tutorId: string, leadId: string) => {
    try {
      await adminApi.archiveLead(tutorId, leadId);
      toast.success('Lead archived');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to archive lead');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login');
    else if (!isAdmin) navigate('/dashboard');
  }, [user, isAdmin, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || !isAdmin) return null;

  useEffect(() => {
    if (allTutors.length > 0) {
      console.log("Admin Debug - All Tutors Data:", allTutors);
    }
  }, [allTutors]);

  const filtered = allTutors.filter(t => {
    const matchSearch = !search ||
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase());
    const matchStep = stepFilter === 'all' || t.onboardingStep === stepFilter;
    const matchVerified = verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && t.isVerified) ||
      (verifiedFilter === 'unverified' && !t.isVerified);
    
    const isSkillExpert = t.roles?.some(r => ['teacher', 'top_rated_teacher', 'um_subscribe-t'].includes(r));
    const isCreator = t.roles?.some(r => ['um_creator'].includes(r)) || t.portalIntent === 'lms';
            const tutorLane = resolveLane(t);
    const matchType = tutorTypeFilter === 'all' || 
      (tutorTypeFilter === 'skills' && isSkillExpert && !isCreator) || 
      (tutorTypeFilter === 'academic' && !isSkillExpert && !isCreator) ||
      (tutorTypeFilter === 'creators' && isCreator);

    const matchIntent = intentFilter === 'all' || t.portalIntent === intentFilter;

    return matchSearch && matchStep && matchVerified && matchType && matchIntent;
  });

  const stats = ONBOARDING_STEPS.map(step => ({
    ...step,
    count: allTutors.filter(t => t.onboardingStep === step.key).length,
  }));

  const verifiedCount = allTutors.filter(t => t.isVerified).length;
  const pendingCount = allTutors.filter(t => !t.isVerified).length;
  const staleCount = allTutors.filter(t => {
    if (t.onboardingStep === 'verification' && t.isVerified) return false;
    const created = new Date(t.createdAt);
    const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 7 && t.onboardingStep !== 'verification';
  }).length;

  const getOnboardingPercent = (t: TutorProfile) => {
    const steps: OnboardingStep[] = ['signup', 'profile', 'test', 'verification'];
    if (t.isVerified) return 100;
    const idx = steps.indexOf(t.onboardingStep);
    return Math.round(((idx + 1) / steps.length) * 100);
  };

  const handleAction = () => {
    if (!actionDialog) return;
    const { type, tutor } = actionDialog;
    switch (type) {
      case 'approve':
        verifyTutor(tutor.id, 'approved', adminNotes);
        toast.success(`${tutor.firstName} has been approved!`);
        break;
      case 'reject':
        verifyTutor(tutor.id, 'rejected', adminNotes);
        toast.error(`${tutor.firstName} has been rejected.`);
        break;
      case 'unverify':
        updateTutorAdmin(tutor.id, { isVerified: false, verificationStatus: 'pending' });
        toast.info(`${tutor.firstName} has been unverified.`);
        break;
      case 'hide':
        updateTutorAdmin(tutor.id, { hiddenFromCatalogue: !tutor.hiddenFromCatalogue });
        toast.success(`${tutor.firstName} ${tutor.hiddenFromCatalogue ? 'shown on' : 'hidden from'} catalogue.`);
        break;
      case 'totm':
        // Clear previous TOTM
        allTutors.forEach(t => {
          if (t.gamification?.tutorOfTheMonth) {
            updateTutorAdmin(t.id, { gamification: { ...t.gamification, tutorOfTheMonth: false } });
          }
        });
        updateTutorAdmin(tutor.id, {
          gamification: {
            ...(tutor.gamification || { points: 0, badges: [], completedModules: [] }),
            tutorOfTheMonth: true,
            tutorOfTheMonthDate: new Date().toISOString().slice(0, 7),
            points: (tutor.gamification?.points || 0) + 1000,
            badges: [...new Set([...(tutor.gamification?.badges || []), 'tutor_of_month'])],
          },
        });
        toast.success(`${tutor.firstName} is now Tutor of the Month! 👑`);
        break;
      case 'nudge':
        nudgeTutor(tutor.id, adminNotes);
        toast.info(`Nudge sent to ${tutor.firstName}!`);
        break;
      case 'delete':
        deleteTutor(tutor.id);
        toast.success(`${tutor.firstName} has been removed.`);
        break;
    }
    setActionDialog(null);
    setAdminNotes('');
  };

  const openDetail = async (tutor: TutorProfile) => {
    setSelectedTutor(tutor);
    setDetailOpen(true);
    setTutorAssessments([]);
    setLoadingAssessments(true);
    try {
      const data = await adminApi.getTutorAssessments(tutor.id);
      setTutorAssessments(data);
    } catch (error) {
      console.error('Failed to fetch tutor assessments:', error);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const hasActiveFilters = search || stepFilter !== 'all' || verifiedFilter !== 'all' || tutorTypeFilter !== 'all' || intentFilter !== 'all';

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo variant="chrome" imgClassName="w-8 h-8" textClassName="font-bold text-lg" />
            <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.open('https://classes.zanetutors.com.ng', '_blank')} className="gap-1.5 hidden sm:flex text-primary">
              <Laptop className="w-4 h-4" /> Go to LMS
            </Button>
            <Link to="/training">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <BookOpen className="w-4 h-4 mr-1" /> Training
              </Button>
            </Link>
            <Link to="/catalogue">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Users className="w-4 h-4 mr-1" /> Catalogue
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <FileText className="w-4 h-4 mr-1" /> Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage tutor onboarding & verification</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <CheckCircle className="w-3 h-3 mr-1 text-success" /> {verifiedCount} verified
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Clock className="w-3 h-3 mr-1" /> {pendingCount} pending
            </Badge>
            {staleCount > 0 && (
              <Badge
                variant={showStale ? 'destructive' : 'outline'}
                className="text-sm px-3 py-1 cursor-pointer select-none"
                onClick={() => setShowStale(!showStale)}
                title={showStale ? 'Click to hide stale warnings' : 'Click to show stale warnings'}
              >
                <AlertTriangle className="w-3 h-3 mr-1" /> {staleCount} stale {showStale ? '(on)' : '(off)'}
              </Badge>
            )}
          </div>
        </div>

        {/* Step Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <Card
              key={s.key}
              className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${stepFilter === s.key ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStepFilter(stepFilter === s.key ? 'all' : s.key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stepColors[s.key]}`}>
                  {stepIcons[s.key]}
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="tutors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="tutors">Tutor Management</TabsTrigger>
            <TabsTrigger value="leads">Booking Requests ({(leads || []).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tutors" className="space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or location..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={stepFilter} onValueChange={setStepFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="w-4 h-4 mr-1" />
                      <SelectValue placeholder="Step" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Steps</SelectItem>
                      {ONBOARDING_STEPS.map(s => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tutorTypeFilter} onValueChange={setTutorTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Tutor Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="skills">Skills Hub</SelectItem>
                      <SelectItem value="creators">Creators Hub</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={intentFilter} onValueChange={setIntentFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Portal Goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Goals</SelectItem>
                      <SelectItem value="teach">Zane Tutor</SelectItem>
                      <SelectItem value="lms">LMS Partner</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStepFilter('all'); setVerifiedFilter('all'); setTutorTypeFilter('all'); setIntentFilter('all'); }}>
                      <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

        {/* Results count & Bulk Select */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {allTutors.length} tutors
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="selectAll" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select All
            </label>
            <Checkbox 
              id="selectAll" 
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
          </div>
        </div>

        {/* Tutor Cards */}
        <div className="grid gap-3">
          {filtered.map(t => {
            const stepInfo = ONBOARDING_STEPS.find(s => s.key === t.onboardingStep);
            const isStale = (() => {
              if (t.onboardingStep === 'verification' && t.isVerified) return false;
              const created = new Date(t.createdAt);
              const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
              return daysSince > 7 && t.onboardingStep !== 'verification';
            })();

            const isCreator = t.roles?.some(r => ['um_creator'].includes(r)) || t.portalIntent === 'lms';
            const tutorLane = resolveLane(t);

            return (
              <Card key={t.id} className={`border-0 shadow-sm hover:shadow-md transition-all ${isStale && showStale ? 'border-l-4 border-l-destructive' : ''} ${selectedIds.includes(t.id) ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Selection */}
                    <div className="flex-shrink-0 self-start sm:self-center">
                      <Checkbox 
                        checked={selectedIds.includes(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{t.firstName} {t.lastName}</h3>
                        {t.isVerified ? (
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                          </Badge>
                        ) : t.verificationStatus === 'rejected' ? (
                          <Badge variant="destructive" className="text-xs">
                            <ShieldX className="w-3 h-3 mr-1" /> Rejected
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Pending</Badge>
                        )}
                        {t.portalIntent === 'lms' ? (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                            <Laptop className="w-3 h-3 mr-1" /> {t.lmsTeachingTrack === 'academic' ? 'LMS Academic' : 'LMS Partner'}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                            <Users className="w-3 h-3 mr-1" /> Zane Tutor
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {LANE_LABELS[tutorLane]}
                        </Badge>
                        {t.monthlyPlanOptIn && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            Monthly Plan
                          </Badge>
                        )}
                        {isStale && showStale && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Stale
                          </Badge>
                        )}
                        {t.lastNudgedAt && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <Bell className="w-3 h-3 mr-1" /> Nudged
                          </Badge>
                        )}
                        {isCreator ? (
                          <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-600 bg-purple-50">
                            <Laptop className="w-3 h-3 mr-1" /> {t.lmsTeachingTrack === 'academic' ? 'Academic Creator' : 'Creator'}
                          </Badge>
                        ) : t.roles?.some(r => ['teacher', 'top_rated_teacher'].includes(r)) ? (
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 bg-amber-50">
                            <Crown className="w-3 h-3 mr-1" /> Skills Expert
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-600 bg-blue-50">
                            <BookOpen className="w-3 h-3 mr-1" /> Academic
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {t.email}</span>
                        {t.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${stepColors[t.onboardingStep]}`}>
                          {stepIcons[t.onboardingStep]}
                          <span className="ml-1">{stepInfo?.label}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">{getOnboardingPercent(t)}%</Badge>
                        {t.hiddenFromCatalogue && (
                          <Badge variant="destructive" className="text-xs">Hidden</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Joined {t.createdAt}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openDetail(t)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {t.onboardingStep === 'verification' && !t.isVerified && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setActionDialog({ type: 'approve', tutor: t })}>
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setActionDialog({ type: 'reject', tutor: t })}>
                            <ShieldX className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {t.isVerified && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setActionDialog({ type: 'unverify', tutor: t })} title="Unverify">
                            <ShieldX className="w-4 h-4 text-orange-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setActionDialog({ type: 'hide', tutor: t })} title={t.hiddenFromCatalogue ? 'Show on catalogue' : 'Hide from catalogue'}>
                            {t.hiddenFromCatalogue ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setActionDialog({ type: 'nudge', tutor: t })} title="Send nudge">
                          <Bell className="w-4 h-4" />
                        </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setActionDialog({ type: 'delete', tutor: t })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                No tutors match your filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedIds.length}
              </span>
              <span className="text-sm font-medium">Selected</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleBulkAction('approve')}>
                <ShieldCheck className="w-4 h-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('nudge')}>
                <Bell className="w-4 h-4 mr-1" /> Nudge
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="ml-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="leads" className="space-y-4">
            {leads.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No booking requests yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {leads.map((lead) => (
                  <Card key={lead.id} className={`border-0 shadow-sm ${lead.status === 'forwarded' ? 'opacity-60' : 'border-l-4 border-l-primary'}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{lead.parentName}</h3>
                            <Badge variant="outline" className="text-[10px]">{lead.date}</Badge>
                            {lead.status === 'forwarded' && (
                              <Badge className="bg-success/20 text-success border-success/30">
                                <Send className="w-3 h-3 mr-1" /> Forwarded
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.parentPhone}
                          </p>
                          <div className="bg-muted/50 p-3 rounded-md mt-2 text-sm">
                            <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Inquiry for {lead.tutorName}:</p>
                            <p className="italic">"{lead.message}"</p>
                            {lead.offerAmount && (
                              <p className="mt-2 font-bold text-primary">Proposed Rate: ₦{parseInt(lead.offerAmount).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {lead.status !== 'forwarded' && (
                            <Button 
                              onClick={() => handleForwardLead(lead.tutorId, lead.id)}
                              className="gap-2"
                            >
                              <Send className="w-4 h-4" /> Forward to Tutor
                            </Button>
                          )}
                          <Button variant="outline" size="icon" onClick={() => window.open(`https://wa.me/${lead.parentPhone.replace(/\D/g, '')}`, '_blank')}>
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleArchiveLead(lead.tutorId, lead.id)} title="Archive Lead">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Tutor Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedTutor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTutor.firstName} {selectedTutor.lastName}
                  {selectedTutor.isVerified && <CheckCircle className="w-5 h-5 text-success" />}
                  {selectedTutor.portalIntent === 'lms' ? (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      {selectedTutor.lmsTeachingTrack === 'academic' ? 'LMS Academic Partner' : 'LMS Partner'}
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">Zane Tutor Path</Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedTutor.email}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium">{selectedTutor.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium">{selectedTutor.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Qualification</p>
                    <p className="font-medium">{selectedTutor.qualification || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Experience</p>
                    <p className="font-medium">{selectedTutor.experience ? `${selectedTutor.experience} years` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Hourly Rate</p>
                    <p className="font-medium">{selectedTutor.hourlyRate ? `₦${selectedTutor.hourlyRate.toLocaleString()}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Current Work</p>
                    <p className="font-medium">{selectedTutor.currentWork || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">TRCN Certified</p>
                    <p className="font-medium">{selectedTutor.trcnCertified ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Class Type</p>
                    <p className="font-medium capitalize">{selectedTutor.classType || '—'}</p>
                  </div>
                </div>

                {/* Rating */}
                {selectedTutor.rating && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Rating</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={selectedTutor.rating} size="sm" />
                      <span className="text-sm">({selectedTutor.reviewCount} reviews)</span>
                    </div>
                  </div>
                )}

                {selectedTutor.subjects.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Subjects</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTutor.subjects.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Intelligence (Internal) */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 tracking-wider">Matching Intelligence (Internal)</p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Gender</p>
                      <p className="font-semibold capitalize">{selectedTutor.gender || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Date of Birth</p>
                      <p className="font-semibold">{selectedTutor.dob || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">State of Origin</p>
                      <p className="font-semibold capitalize">{selectedTutor.stateOfOrigin || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Tutor Type</p>
                      <p className="font-semibold">
                        {selectedTutor.isCorpsMember ? '🎖 NYSC / Corps Member' : '🎓 Professional / Graduate'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Success Stories & Academic Achievements */}
                {(selectedTutor.successStories || selectedTutor.academicAchievements) && (
                  <div className="space-y-3">
                    {selectedTutor.successStories && (
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-xs font-bold text-primary mb-1 text-center">Student Success Stories</p>
                        <p className="text-xs italic text-muted-foreground text-center">"{selectedTutor.successStories}"</p>
                      </div>
                    )}
                    {selectedTutor.academicAchievements && (
                      <div>
                        <p className="text-xs font-bold mb-1">Academic Achievements</p>
                        <p className="text-xs text-muted-foreground">{selectedTutor.academicAchievements}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedTutor.preferredLevels.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Preferred Levels</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTutor.preferredLevels.map(l => (
                        <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTutor.briefIntro && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Brief Intro</p>
                    <p className="text-sm">{selectedTutor.briefIntro}</p>
                  </div>
                )}

                {selectedTutor.teachingHistory && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Teaching History</p>
                    <p className="text-sm">{selectedTutor.teachingHistory}</p>
                  </div>
                )}

                {selectedTutor.classDelivery && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Teaching Approach</p>
                    <p className="text-sm">{selectedTutor.classDelivery}</p>
                  </div>
                )}

                {/* Availability Slots */}
                {selectedTutor.availabilitySlots && selectedTutor.availabilitySlots.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Availability Schedule</p>
                    <div className="space-y-1">
                      {selectedTutor.availabilitySlots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-medium w-24">{slot.day}</span>
                          <span className="text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTutor.availability && !selectedTutor.availabilitySlots?.length && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Availability</p>
                    <p className="text-sm">{selectedTutor.availability}</p>
                  </div>
                )}

                {/* Assessment Intelligence */}
                {selectedTutor.assessmentHistory && selectedTutor.assessmentHistory.length > 0 && (
                  <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-secondary" />
                      <p className="text-xs font-bold uppercase tracking-wider text-secondary">Assessment Intelligence</p>
                    </div>
                    
                    {(() => {
                      const latest = selectedTutor.assessmentHistory[selectedTutor.assessmentHistory.length - 1].data;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-background rounded p-2 border">
                              <p className="text-[10px] text-muted-foreground uppercase">Readiness Score</p>
                              <p className="text-lg font-bold text-primary">{latest.compositeScore || latest.finalReadinessScore}/100</p>
                            </div>
                            <div className="bg-background rounded p-2 border">
                              <p className="text-[10px] text-muted-foreground uppercase">Tutor Rating</p>
                              <p className="text-sm font-bold capitalize">{latest.tutorRating || 'Developing'}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Section Breakdown</p>
                            <div className="grid gap-2">
                              {latest.subjectResults?.map((sr: any) => (
                                <div key={sr.subject} className="flex items-center justify-between text-xs bg-background p-2 rounded border">
                                  <span className="font-medium">{sr.subject}</span>
                                  <span className="font-bold">{sr.percentage}%</span>
                                </div>
                              ))}
                              {latest.digitalToolsOverall && (
                                <div className="flex items-center justify-between text-xs bg-background p-2 rounded border border-accent/20">
                                  <span className="font-medium flex items-center gap-1"><Laptop className="w-3 h-3" /> Digital Tools</span>
                                  <span className="font-bold">{latest.digitalToolsOverall.percentage}%</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {latest.psychResults && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Psychological Profile (Hidden from Tutor)</p>
                              <div className="grid grid-cols-2 gap-2">
                                {latest.psychResults.map((pr: any) => (
                                  <div key={pr.category} className="bg-background p-2 rounded border text-[10px]">
                                    <p className="text-muted-foreground capitalize mb-0.5">{pr.category}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold">{pr.percentage}%</span>
                                      <span className={`px-1 rounded-sm ${pr.level === 'strong' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {pr.level}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <Separator />

                {/* Documents */}
                <div>
                  <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Submitted Documents</p>
                  {selectedTutor.uploadedDocs && Object.keys(selectedTutor.uploadedDocs).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(selectedTutor.uploadedDocs).map(([key, name]) => {
                        const isUrl = String(name).startsWith('http://') || String(name).startsWith('https://');
                        return (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <span className="capitalize font-medium">{key === 'id' ? 'Government ID' : key === 'cert' ? 'Certificate' : 'Photo'}:</span>
                            {isUrl ? (
                              <a href={String(name)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                                View Submitted Document
                              </a>
                            ) : (
                              <span className="text-muted-foreground truncate">{String(name)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No documents uploaded yet</p>
                  )}
                </div>

                {/* Doc Expiry Alerts */}
                {selectedTutor.uploadedDocsDetailed && Object.entries(selectedTutor.uploadedDocsDetailed).map(([key, doc]) => {
                  if (!doc.expiryDate) return null;
                  const expiry = new Date(doc.expiryDate);
                  const daysUntil = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (daysUntil > 30) return null;
                  return (
                    <div key={key} className={`flex items-center gap-2 p-2 rounded text-xs ${daysUntil < 0 ? 'bg-destructive/10 text-destructive' : 'bg-yellow-50 text-yellow-800'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium capitalize">{key === 'id' ? 'Government ID' : key}:</span>
                      <span>{daysUntil < 0 ? `Expired ${Math.abs(daysUntil)} days ago` : `Expires in ${daysUntil} days`}</span>
                      {daysUntil < 0 && <Badge variant="destructive" className="text-[10px] ml-auto">Action Needed</Badge>}
                    </div>
                  );
                })}

                 {/* Gamification Info */}
                {selectedTutor.gamification && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Points:</span>
                    <Badge variant="secondary" className="text-xs">{selectedTutor.gamification.points} pts</Badge>
                    <span className="text-xs text-muted-foreground ml-2">Badges:</span>
                    {selectedTutor.gamification.badges.map(b => {
                      const badge = GAMIFICATION_BADGES.find(gb => gb.id === b);
                      return badge ? <span key={b} title={badge.label} className="text-sm">{badge.icon}</span> : null;
                    })}
                    {selectedTutor.gamification.tutorOfTheMonth && <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">👑 TOTM</Badge>}
                  </div>
                )}

                <Separator />

                {/* Assessment History */}
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4" /> Assessment History
                  </h4>
                  {loadingAssessments ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : tutorAssessments.length > 0 ? (
                    <div className="space-y-3">
                      {tutorAssessments.map(a => (
                        <AssessmentHistoryCard key={a.id} assessment={a} onView={setSelectedAssessmentId} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-muted/50 p-3 rounded-md text-center">No assessments completed yet.</p>
                  )}
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={stepColors[selectedTutor.onboardingStep]}>
                      {stepIcons[selectedTutor.onboardingStep]}
                      <span className="ml-1">{ONBOARDING_STEPS.find(s => s.key === selectedTutor.onboardingStep)?.label}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">Joined {selectedTutor.createdAt}</span>
                  </div>
                  {selectedTutor.adminNotes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                      {selectedTutor.adminNotes}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2 flex-wrap">
                {selectedTutor.onboardingStep === 'verification' && !selectedTutor.isVerified && (
                  <>
                    <Button className="bg-success hover:bg-success/90" onClick={() => { setDetailOpen(false); setActionDialog({ type: 'approve', tutor: selectedTutor }); }}>
                      <ShieldCheck className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" onClick={() => { setDetailOpen(false); setActionDialog({ type: 'reject', tutor: selectedTutor }); }}>
                      <ShieldX className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {selectedTutor.isVerified && (
                  <>
                    <Button variant="outline" onClick={() => { setDetailOpen(false); setActionDialog({ type: 'unverify', tutor: selectedTutor }); }}>
                      <ShieldX className="w-4 h-4 mr-1" /> Unverify
                    </Button>
                    <Button variant="outline" onClick={() => { setDetailOpen(false); setActionDialog({ type: 'hide', tutor: selectedTutor }); }}>
                      <Eye className="w-4 h-4 mr-1" /> {selectedTutor.hiddenFromCatalogue ? 'Show' : 'Hide'}
                    </Button>
                    <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-50" onClick={() => { setDetailOpen(false); setActionDialog({ type: 'totm', tutor: selectedTutor }); }}>
                      <Crown className="w-4 h-4 mr-1" /> Tutor of Month
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => { setDetailOpen(false); setActionDialog({ type: 'nudge', tutor: selectedTutor }); }}>
                    <Bell className="w-4 h-4 mr-1" /> Nudge
                  </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AssessmentDetailDialog
        assessmentId={selectedAssessmentId}
        open={selectedAssessmentId !== null}
        onOpenChange={open => { if (!open) setSelectedAssessmentId(null); }}
      />

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setAdminNotes(''); }}>
        <DialogContent>
          {actionDialog && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {actionDialog.type === 'approve' && `Approve ${actionDialog.tutor.firstName}?`}
                  {actionDialog.type === 'reject' && `Reject ${actionDialog.tutor.firstName}?`}
                  {actionDialog.type === 'nudge' && `Nudge ${actionDialog.tutor.firstName}?`}
                  {actionDialog.type === 'delete' && `Remove ${actionDialog.tutor.firstName}?`}
                  {actionDialog.type === 'unverify' && `Unverify ${actionDialog.tutor.firstName}?`}
                  {actionDialog.type === 'hide' && `${actionDialog.tutor.hiddenFromCatalogue ? 'Show' : 'Hide'} ${actionDialog.tutor.firstName}?`}
                  {actionDialog.type === 'totm' && `Make ${actionDialog.tutor.firstName} Tutor of the Month?`}
                </DialogTitle>
                <DialogDescription>
                  {actionDialog.type === 'approve' && 'This tutor will be verified and visible on the catalogue.'}
                  {actionDialog.type === 'reject' && 'This tutor will be notified that their application was not approved.'}
                  {actionDialog.type === 'nudge' && `Send a reminder to complete their ${ONBOARDING_STEPS.find(s => s.key === actionDialog.tutor.onboardingStep)?.label} step.`}
                  {actionDialog.type === 'delete' && 'This action cannot be undone. The tutor will be permanently removed.'}
                  {actionDialog.type === 'unverify' && 'This tutor will lose their verified status and be removed from the catalogue until re-verified.'}
                  {actionDialog.type === 'hide' && (actionDialog.tutor.hiddenFromCatalogue ? 'This tutor will be shown on the catalogue again.' : 'This tutor will be hidden from the catalogue but remain verified.')}
                  {actionDialog.type === 'totm' && 'This will award 1,000 points, grant the 👑 badge, and display them as Tutor of the Month. The previous TOTM will be replaced.'}
                </DialogDescription>
              </DialogHeader>
              {(actionDialog.type === 'approve' || actionDialog.type === 'reject' || actionDialog.type === 'nudge') && (
                <Textarea
                  placeholder={actionDialog.type === 'nudge' ? 'Add a nudge message (optional)...' : 'Add admin notes (optional)...'}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                />
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setActionDialog(null); setAdminNotes(''); }}>Cancel</Button>
                <Button
                  variant={actionDialog.type === 'delete' || actionDialog.type === 'reject' || actionDialog.type === 'unverify' ? 'destructive' : 'default'}
                  className={actionDialog.type === 'approve' ? 'bg-success hover:bg-success/90' : actionDialog.type === 'totm' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                  onClick={handleAction}
                >
                  {actionDialog.type === 'approve' && 'Approve'}
                  {actionDialog.type === 'reject' && 'Reject'}
                  {actionDialog.type === 'nudge' && 'Send Nudge'}
                  {actionDialog.type === 'delete' && 'Remove'}
                  {actionDialog.type === 'unverify' && 'Unverify'}
                  {actionDialog.type === 'hide' && (actionDialog.tutor.hiddenFromCatalogue ? 'Show on Catalogue' : 'Hide from Catalogue')}
                  {actionDialog.type === 'totm' && '👑 Award TOTM'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
