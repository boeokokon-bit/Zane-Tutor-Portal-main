import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, LOCATIONS, LEVELS, CLASS_TYPES, LmsTeachingTrack, PastProject } from '@/types/tutor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import AvailabilityPicker from '@/components/onboarding/AvailabilityPicker';
import { toast } from 'sonner';
import { Save, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { MACRO_CATEGORIES } from '@/lib/categories';
import { resolveLane, getRequiredAssessments, LANE_LABELS } from '@/lib/lanes';

export default function ProfileStep() {
  const { user, updateProfile, advanceStep } = useAuth();
  const isSkill = user?.accountType === 'skill' || user?.roles?.some(r => ['teacher', 'top_rated_teacher'].includes(r));
  const [form, setForm] = useState({
    qualification: user?.qualification || '',
    macroCategory: user?.macroCategory || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    subjects: user?.subjects || [],
    experience: user?.experience || 0,
    hourlyRate: user?.hourlyRate || 0,
    briefIntro: user?.briefIntro || '',
    preferredLevels: user?.preferredLevels || [],
    currentWork: user?.currentWork || '',
    availability: user?.availability || '',
    availabilitySlots: user?.availabilitySlots || [],
    teachingHistory: user?.teachingHistory || '',
    classDelivery: user?.classDelivery || '',
    classType: user?.classType || 'offline',
    trcnCertified: user?.trcnCertified || false,
    location: user?.location || '',
    pastProjects: (user?.pastProjects || []) as PastProject[],
    portalIntent: user?.portalIntent || 'teach',
    lmsTeachingTrack: (user?.lmsTeachingTrack || 'general') as LmsTeachingTrack,
    monthlyPlanOptIn: !!user?.monthlyPlanOptIn,
  });

  const isLMS = form.portalIntent === 'lms';
  // Compute the active lane from the in-progress form values so toggles update live
  const previewUser = { ...(user || {}), ...form } as any;
  const lane = resolveLane(previewUser);
  const isAcademic = lane === 'academic_monthly' || lane === 'academic_catalogue';
  const requiresAcademicCredentials =
    (form.portalIntent === 'teach' && !isSkill) ||
    (isLMS && form.lmsTeachingTrack === 'academic');
  const requiresTeachingSubjects = form.portalIntent === 'teach' || form.lmsTeachingTrack === 'academic';
  const optionalText = (required: boolean) => required ? ' *' : ' (optional)';

  const progress = useMemo(() => {
    const fields = [
      !!form.firstName,
      !!form.lastName,
      !!form.macroCategory,
      !!form.location,
    ];

    if (requiresAcademicCredentials) fields.push(!!form.qualification);
    if (requiresTeachingSubjects) {
      fields.push(
        form.subjects.length > 0,
        form.preferredLevels.length > 0
      );
    }
    
    if (!isLMS) {
      fields.push(
        form.experience > 0,
        form.hourlyRate > 0,
        !!form.briefIntro,
        !!form.currentWork,
        !!form.teachingHistory,
        !!form.classDelivery,
        form.availabilitySlots.length > 0
      );
    }
    
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form, isLMS, requiresAcademicCredentials, requiresTeachingSubjects]);

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleSave = () => {
    updateProfile(form);
    toast.success('Profile saved!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingRequired =
      !form.macroCategory ||
      !form.firstName ||
      !form.lastName ||
      !form.location ||
      (requiresAcademicCredentials && !form.qualification) ||
      (requiresTeachingSubjects && form.subjects.length === 0) ||
      (requiresTeachingSubjects && form.preferredLevels.length === 0);

    if (missingRequired) {
      toast.error('Please fill in all required fields');
      return;
    }
    await updateProfile(form);

    // Route based on resolved lane
    const updatedLane = resolveLane({ ...previewUser, ...form });
    const req = getRequiredAssessments(updatedLane);
    const needsAssessment =
      req.subject === 'required' || req.subject === 'optional' ||
      req.digital === 'required' || req.digital === 'optional' ||
      req.psych === 'required' || req.psych === 'optional';

    if (needsAssessment) {
      await advanceStep('test');
      toast.success(`Profile saved. Continuing to your ${LANE_LABELS[updatedLane]} assessment.`);
    } else {
      await advanceStep('verification');
      toast.success('Profile saved. Continuing to verification.');
    }
  };

  const updateProject = (i: number, key: keyof PastProject, value: string) => {
    setForm(p => ({
      ...p,
      pastProjects: p.pastProjects.map((pp, idx) => idx === i ? { ...pp, [key]: value } : pp),
    }));
  };
  const addProject = () => {
    if (form.pastProjects.length >= 5) return;
    setForm(p => ({ ...p, pastProjects: [...p.pastProjects, { title: '', description: '', link: '' }] }));
  };
  const removeProject = (i: number) => {
    setForm(p => ({ ...p, pastProjects: p.pastProjects.filter((_, idx) => idx !== i) }));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <CardDescription>Tell us about your teaching experience and preferences</CardDescription>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile completion</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 rounded-lg border-2 border-accent/20 bg-accent/5">
          <Label className="text-base font-semibold mb-2 block">Primary Portal Goal</Label>
          <RadioGroup 
            value={form.portalIntent} 
            onValueChange={v => setForm(p => ({
              ...p,
              portalIntent: v as 'teach' | 'lms',
              lmsTeachingTrack: v === 'lms' ? p.lmsTeachingTrack : 'general',
            }))}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.portalIntent === 'teach' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
              <RadioGroupItem value="teach" />
              <div>
                <p className="text-sm font-medium">🚀 Teach with Zane</p>
                <p className="text-xs text-muted-foreground">Join our tutor catalogue</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.portalIntent === 'lms' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
              <RadioGroupItem value="lms" />
              <div>
                <p className="text-sm font-medium">💻 Use Classes LMS</p>
                <p className="text-xs text-muted-foreground">Manage my own students</p>
              </div>
            </label>
          </RadioGroup>
          {isLMS && (
            <div className="mt-4 rounded-lg border bg-background p-3">
              <Label className="text-sm font-semibold mb-2 block">LMS Teaching Setup</Label>
              <RadioGroup
                value={form.lmsTeachingTrack}
                onValueChange={v => setForm(p => ({ ...p, lmsTeachingTrack: v as LmsTeachingTrack }))}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.lmsTeachingTrack === 'general' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
                  <RadioGroupItem value="general" />
                  <div>
                    <p className="text-sm font-medium">Use LMS only</p>
                    <p className="text-xs text-muted-foreground">Manage classes without academic certification requirements</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.lmsTeachingTrack === 'academic' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/30'}`}>
                  <RadioGroupItem value="academic" />
                  <div>
                    <p className="text-sm font-medium">LMS + academic teaching</p>
                    <p className="text-xs text-muted-foreground">Teach academic subjects, qualification required</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            * Note: Teach with Zane academic tutors need a qualification and proficiency assessment. Skills tutors and LMS-only users can continue without a certificate.
          </p>
        </div>

        {isAcademic && (
          <div className="mb-6 p-4 rounded-lg border-2 border-secondary/30 bg-secondary/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-base font-semibold">Apply for Monthly Fixed Plans</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Default is catalogue-only with independent rates. Opt in for our monthly fixed plans to be eligible for higher commitment placements. This will require extra documents (guarantor form, NYSC ID, ICE contact) and locks in compulsory subject + psych assessments.
                </p>
              </div>
              <Switch
                checked={form.monthlyPlanOptIn}
                onCheckedChange={v => setForm(p => ({ ...p, monthlyPlanOptIn: v }))}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="space-y-2">
                <Label>Qualification{optionalText(requiresAcademicCredentials)}</Label>
                <Input placeholder="e.g. B.Sc Mathematics" value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} />
                <Label>First Name *</Label>
                <Input placeholder="First name" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                <Label>Last Name *</Label>
                <Input placeholder="Last name" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
            </div>
            <div className="space-y-2">
                <Label>Location *</Label>
              <Select value={form.location} onValueChange={v => setForm(p => ({ ...p, location: v }))}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teaching Area (Category) *</Label>
              <Select value={form.macroCategory} onValueChange={v => setForm(p => ({ ...p, macroCategory: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {MACRO_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input type="number" min={0} value={form.experience} onChange={e => setForm(p => ({ ...p, experience: parseInt(e.target.value) || 0 }))} />
            </div>
            {form.portalIntent !== 'lms' && (
              <div className="space-y-2">
                <Label>Hourly Rate (₦)</Label>
                <Input type="number" min={0} value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: parseInt(e.target.value) || 0 }))} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Current Work / Employer</Label>
              <Input placeholder="e.g. Freelance Tutor" value={form.currentWork} onChange={e => setForm(p => ({ ...p, currentWork: e.target.value }))} />
            </div>
            {form.portalIntent !== 'lms' && (
              <div className="space-y-2">
                <Label>Availability</Label>
                <Input placeholder="e.g. Weekends, Evenings" value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Subjects You Teach{optionalText(requiresTeachingSubjects)}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBJECTS.map(s => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.subjects.includes(s)} onCheckedChange={() => setForm(p => ({ ...p, subjects: toggleItem(p.subjects, s) }))} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Teaching Levels{optionalText(requiresTeachingSubjects)}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEVELS.map(l => (
                <label key={l} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.preferredLevels.includes(l)} onCheckedChange={() => setForm(p => ({ ...p, preferredLevels: toggleItem(p.preferredLevels, l) }))} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {form.portalIntent !== 'lms' && (
            <div className="space-y-2">
              <Label>Brief Introduction</Label>
              <Textarea placeholder="Tell parents about yourself..." value={form.briefIntro} onChange={e => setForm(p => ({ ...p, briefIntro: e.target.value }))} rows={3} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Teaching History</Label>
            <Textarea placeholder="Schools taught at, number of students, notable achievements..." value={form.teachingHistory} onChange={e => setForm(p => ({ ...p, teachingHistory: e.target.value }))} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Teaching Approach / Class Delivery</Label>
            <Textarea placeholder="Describe how you structure and deliver your classes..." value={form.classDelivery} onChange={e => setForm(p => ({ ...p, classDelivery: e.target.value }))} rows={3} />
          </div>

          <div className="space-y-3">
            <Label>Class Type</Label>
            <RadioGroup value={form.classType} onValueChange={v => setForm(p => ({ ...p, classType: v as any }))} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CLASS_TYPES.map(ct => (
                <label key={ct.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.classType === ct.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <RadioGroupItem value={ct.value} />
                  <div>
                    <p className="text-sm font-medium">{ct.label}</p>
                    <p className="text-xs text-muted-foreground">{ct.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">TRCN Certified</Label>
              <p className="text-xs text-muted-foreground">Teachers Registration Council of Nigeria</p>
            </div>
            <Switch checked={form.trcnCertified} onCheckedChange={v => setForm(p => ({ ...p, trcnCertified: v }))} />
          </div>

          {form.portalIntent !== 'lms' && (
            <div className="space-y-2">
              <Label>Availability Schedule</Label>
              <p className="text-xs text-muted-foreground">Add the days and times you're available to teach</p>
              <AvailabilityPicker value={form.availabilitySlots} onChange={slots => setForm(p => ({ ...p, availabilitySlots: slots }))} />
            </div>
          )}

          {isSkill && (
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Past Projects / Portfolio</Label>
                  <p className="text-xs text-muted-foreground">Showcase up to 5 projects. Public viewers see only the title & description; admins also see your link for review.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addProject} disabled={form.pastProjects.length >= 5}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {form.pastProjects.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No projects added yet — click "Add" to showcase your work.</p>
              )}
              {form.pastProjects.map((p, i) => (
                <div key={i} className="space-y-2 p-3 rounded-md border bg-background">
                  <div className="flex items-start gap-2">
                    <Input placeholder="Project title" value={p.title} onChange={e => updateProject(i, 'title', e.target.value)} />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeProject(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Textarea placeholder="Short description (what you built / your role)" value={p.description} onChange={e => updateProject(i, 'description', e.target.value)} rows={2} />
                  <Input placeholder="Link (URL — visible to admin only)" value={p.link || ''} onChange={e => updateProject(i, 'link', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Save Progress
            </Button>
            <Button type="submit" size="lg" className="flex-1">
              {isSkill || form.portalIntent === 'lms' ? 'Save & Continue to Verification' : 'Save & Continue'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
