import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, LOCATIONS, LEVELS, CLASS_TYPES } from '@/types/tutor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import AvailabilityPicker from '@/components/onboarding/AvailabilityPicker';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function InlineProfileEditor() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    qualification: user?.qualification || '',
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
  });

  const progress = useMemo(() => {
    const fields = [
      !!form.qualification, form.subjects.length > 0, !!form.location,
      form.experience > 0, form.hourlyRate > 0, !!form.briefIntro,
      form.preferredLevels.length > 0, !!form.currentWork,
      !!form.teachingHistory, !!form.classDelivery, form.availabilitySlots.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const handleSave = () => {
    updateProfile(form);
    toast.success('Profile updated!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Profile completion</span>
        <span className="font-semibold text-primary">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />

      <div className="grid grid-cols-1 gap-4 w-full">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input type="tel" placeholder="+234 xxx xxx xxxx" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Qualification</Label>
          <Input placeholder="e.g. B.Sc Mathematics" value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={form.location} onValueChange={v => setForm(p => ({ ...p, location: v }))}>
            <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Years of Experience</Label>
          <Input type="number" min={0} value={form.experience} onChange={e => setForm(p => ({ ...p, experience: parseInt(e.target.value) || 0 }))} />
        </div>
        <div className="space-y-2">
          <Label>Hourly Rate (₦)</Label>
          <Input type="number" min={0} value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: parseInt(e.target.value) || 0 }))} />
        </div>
        <div className="space-y-2">
          <Label>Current Work / Employer</Label>
          <Input placeholder="e.g. Freelance Tutor" value={form.currentWork} onChange={e => setForm(p => ({ ...p, currentWork: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-2 w-full">
        <Label>Subjects You Teach</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUBJECTS.map(s => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.subjects.includes(s)} onCheckedChange={() => setForm(p => ({ ...p, subjects: toggleItem(p.subjects, s) }))} />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 w-full">
        <Label>Preferred Teaching Levels</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LEVELS.map(l => (
            <label key={l} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.preferredLevels.includes(l)} onCheckedChange={() => setForm(p => ({ ...p, preferredLevels: toggleItem(p.preferredLevels, l) }))} />
              {l}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Brief Introduction</Label>
        <Textarea placeholder="Tell parents about yourself..." value={form.briefIntro} onChange={e => setForm(p => ({ ...p, briefIntro: e.target.value }))} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Teaching History</Label>
        <Textarea placeholder="Schools taught at, notable achievements..." value={form.teachingHistory} onChange={e => setForm(p => ({ ...p, teachingHistory: e.target.value }))} rows={3} />
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

      <div className="space-y-2">
        <Label>Availability Schedule</Label>
        <p className="text-xs text-muted-foreground">Add the days and times you're available to teach</p>
        <AvailabilityPicker value={form.availabilitySlots} onChange={slots => setForm(p => ({ ...p, availabilitySlots: slots }))} />
      </div>

      <Button size="lg" className="w-full" onClick={handleSave}>
        <Save className="w-4 h-4 mr-2" /> Update Profile
      </Button>
    </div>
  );
}
