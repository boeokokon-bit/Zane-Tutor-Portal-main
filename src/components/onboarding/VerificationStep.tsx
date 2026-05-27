import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, CheckCircle2, FileText, ShieldCheck, Loader2 } from 'lucide-react';
import { tutorApi } from '@/lib/api';
import { resolveLane, getRequiredDocs, LANE_LABELS } from '@/lib/lanes';

export default function VerificationStep() {
  const { user, updateProfile } = useAuth();
  const lane = resolveLane(user);
  const docs = getRequiredDocs(lane);
  const [files, setFiles] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (user?.uploadedDocs) {
      docs.forEach(d => { if (user.uploadedDocs![d.key]) initial[d.key] = user.uploadedDocs![d.key]; });
    }
    return initial;
  });
  const [expiries, setExpiries] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (user?.uploadedDocsDetailed) {
      Object.entries(user.uploadedDocsDetailed).forEach(([k, v]) => { if (v.expiryDate) init[k] = v.expiryDate; });
    }
    return init;
  });

  const [uploading, setUploading] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState<boolean>(user?.verificationStatus !== 'pending');

  const handleFile = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(key);
    toast.loading(`Uploading ${docs.find(d => d.key === key)?.label || 'document'}...`, { id: `upload-${key}` });
    
    try {
      const res = await tutorApi.uploadDocument(file);
      const url = res.url;
      setFiles(prev => ({ ...prev, [key]: url }));
      toast.success('Upload complete!', { id: `upload-${key}` });
    } catch (err) {
      toast.error('Upload failed. Please try again.', { id: `upload-${key}` });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    const missing = docs.filter(d => d.level === 'required' && !files[d.key]);
    if (missing.length) {
      toast.error(`Please upload: ${missing.map(d => d.label).join(', ')}`);
      return;
    }
    const idDoc = docs.find(d => d.needsExpiry);
    if (idDoc && idDoc.level === 'required' && files[idDoc.key] && !expiries[idDoc.key]) {
      toast.error('Please enter the expiry date on your ID');
      return;
    }
    const detailed: Record<string, { fileName: string; uploadedAt: string; expiryDate?: string }> = {};
    Object.entries(files).forEach(([k, url]) => {
      detailed[k] = {
        fileName: url.split('/').pop() || url,
        uploadedAt: new Date().toISOString(),
        expiryDate: expiries[k] || undefined,
      };
    });
    try {
      await updateProfile({
        isVerified: false,
        verificationStatus: 'pending',
        uploadedDocs: files,
        uploadedDocsDetailed: detailed,
      });
      setShowUpload(false);
      toast.success('Documents submitted! Our team will review within 24-48 hours.');
    } catch (err) {
      toast.error('Could not submit your documents. Please try again.');
    }
  };

  if (user?.isVerified) {
    return (
      <Card className="border-0 shadow-lg text-center">
        <CardContent className="py-12 space-y-4">
          <ShieldCheck className="w-16 h-16 mx-auto text-secondary" />
          <h2 className="text-2xl font-bold font-serif">You're Verified!</h2>
          <p className="text-muted-foreground">
            {user?.portalIntent === 'teach'
              ? 'Your profile is live on the ZaneTutors catalogue. Parents can now find and book you.'
              : 'Your account has been verified. You can continue using your Classes LMS tools.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pending verification view
  if (user?.verificationStatus === 'pending' && !showUpload) {
    return (
      <Card className="border-0 shadow-lg text-center">
        <CardContent className="py-12 space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <h2 className="text-2xl font-bold">Verification Under Way</h2>
          <p className="text-muted-foreground">Our team is reviewing your documents. This may take 24‑48 hours.</p>
          <Button onClick={() => setShowUpload(true)}>Re‑upload Files</Button>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" /> Verification
        </CardTitle>
        <CardDescription>
          {LANE_LABELS[lane]} — upload the documents below for review. Required items must be submitted before approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {docs.map(doc => (
          <div key={doc.key} className="space-y-2">
            <Label className="font-semibold">
              {doc.label}
              <span className={`ml-2 text-xs ${doc.level === 'required' ? 'text-destructive' : 'text-muted-foreground'}`}>
                ({doc.level})
              </span>
            </Label>
            <p className="text-xs text-muted-foreground">{doc.desc}</p>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                {files[doc.key] ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm truncate">{files[doc.key].split('/').pop()}</span>
                  </>
                ) : uploading === doc.key ? (
                  <>
                    <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                    <span className="text-sm text-primary">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                  </>
                )}
                <Input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFile(doc.key, e)} disabled={uploading === doc.key} />
              </label>
            </div>
            {doc.needsExpiry && files[doc.key] && (
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">ID expiry date:</Label>
                <Input
                  type="date"
                  value={expiries[doc.key] || ''}
                  onChange={e => setExpiries(prev => ({ ...prev, [doc.key]: e.target.value }))}
                  className="h-8 max-w-[200px]"
                />
              </div>
            )}
          </div>
        ))}

        <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens next?</p>
            <p>
              {user?.portalIntent === 'teach'
                ? "Our team reviews your documents within 24-48 hours. Once verified, you'll get a badge on your profile and appear higher in search results."
                : 'Our team reviews your documents within 24-48 hours. Once verified, your LMS account will show as approved.'}
            </p>
          </div>
        </div>

        <Button onClick={handleSubmit} size="lg" className="w-full">Submit for Verification</Button>
      </CardContent>
    </Card>
  );
}
