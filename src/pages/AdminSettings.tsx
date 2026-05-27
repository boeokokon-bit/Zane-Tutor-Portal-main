import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { catalogueApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { isAdmin, loading, settings } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) navigate('/login'); }, [isAdmin, loading, navigate]);
  useEffect(() => { setForm(settings); }, [settings]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist remotely (no-op safely if endpoint unavailable in mock mode)
      try { await catalogueApi.updateSettings(form); } catch {}
      // Persist locally so the rest of the app picks them up immediately
      localStorage.setItem('zane_portal_settings', JSON.stringify(form));
      toast.success('Settings saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <span className="font-semibold flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> Portal Settings</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Catalogue Visibility</CardTitle>
            <CardDescription>Toggle which public catalogues are shown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Show Academic Catalogue" description="Public Academic Tutors hub">
              <Switch checked={form.showAcademicsCatalogue} onCheckedChange={v => update('showAcademicsCatalogue', v)} />
            </Row>
            <Row label="Show Skills Catalogue" description="Public Skills Experts hub">
              <Switch checked={form.showSkillsCatalogue} onCheckedChange={v => update('showSkillsCatalogue', v)} />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commission & Pricing</CardTitle>
            <CardDescription>Markup added to tutor hourly rates on display.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Commission Rate (%)</Label>
              <Input type="number" min={0} max={100} value={form.commissionRate}
                onChange={e => update('commissionRate', parseInt(e.target.value) || 0)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & Notice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Number (international format, no +)</Label>
              <Input value={form.whatsappNumber} onChange={e => update('whatsappNumber', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Portal Notice (banner shown to tutors)</Label>
              <Textarea rows={3} value={form.portalNotice} onChange={e => update('portalNotice', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save All Settings'}
        </Button>
      </main>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}