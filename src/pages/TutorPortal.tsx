import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingStep } from '@/types/tutor';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import StarRating from '@/components/catalogue/StarRating';
import InlineProfileEditor from '@/components/portal/InlineProfileEditor';
import GamificationPanel from '@/components/portal/GamificationPanel';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';
import {
  GraduationCap, LogOut, User, Settings, Bell, Eye, BookOpen, Clock,
  MapPin, Briefcase, Award, ShieldCheck, CheckCircle2, AlertCircle, Upload, FileText,
  Trophy, Pencil, Calendar, Phone, ArrowRight, Laptop, Brain
} from 'lucide-react';
import { tutorApi } from '@/lib/api';

export default function TutorPortal() {
  const { user, loading, logout, updateProfile, refreshProfile, settings } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    registration: true,
    programs: true,
    updates: true,
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [editMode, setEditMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  const getOnboardingPercent = () => {
    const steps: OnboardingStep[] = ['signup', 'profile', 'test', 'verification'];
    const idx = steps.indexOf(user.onboardingStep);
    if (user.isVerified) return 100;
    return Math.round(((idx + 1) / steps.length) * 100);
  };

  const isPending = !user.isVerified;
  const statusColor = user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  const statusText = user.isVerified ? 'Verified' : (user.verificationStatus === 'rejected' ? 'Needs Revision' : 'Pending Review');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    toast.success('Password updated successfully');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const readFileAsDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // Check for expiring docs
  const getDocExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { status: 'expired', label: 'Expired', color: 'bg-destructive/10 text-destructive' };
    if (daysUntil <= 30) return { status: 'expiring', label: `Expires in ${daysUntil} days`, color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'valid', label: `Valid until ${expiry.toLocaleDateString()}`, color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-muted/30">
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
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
                <User className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <Link to="/training">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
                <BookOpen className="w-4 h-4 mr-1" /> Training
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }} className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {isPending && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800">Your profile is under review</p>
                <p className="text-sm text-yellow-700">Our team is reviewing your documents. You'll be notified once approved (typically 24-48 hours).</p>
              </div>
            </CardContent>
          </Card>
        )}
        {user.isVerified && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">You're verified!</p>
                <p className="text-sm text-green-700">Your profile is live on the catalogue. You can still update your details, documents, and preferences anytime.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {settings.portalNotice && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary/80">{settings.portalNotice}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile" className="space-y-6" onValueChange={(v) => { if (v === 'bookings') refreshProfile(); }}>
          <TabsList className="flex w-full overflow-x-auto hide-scrollbar justify-start sm:grid sm:grid-cols-7 h-auto bg-muted p-1 rounded-lg">
            <TabsTrigger value="profile" className="gap-1.5"><Eye className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5"><Calendar className="w-4 h-4" /> Bookings</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5"><Upload className="w-4 h-4" /> Verification</TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1.5"><Trophy className="w-4 h-4" /> Badges</TabsTrigger>
            <TabsTrigger value="assessment" className="gap-1.5"><BookOpen className="w-4 h-4" /> Assessment</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5"><Bell className="w-4 h-4" /> Alerts</TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="w-6 h-6" /> {editMode ? 'Edit Profile' : 'Profile Preview'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor}>{statusText}</Badge>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> {editMode ? 'View Preview' : 'Edit'}
                    </Button>
                  </div>
                </div>
                <CardDescription>{editMode ? 'Update your profile details below' : 'This is how your profile appears to parents'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {editMode ? (
                  <InlineProfileEditor />
                ) : (
                  <>
                    {/* Profile Preview */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
                        <p className="text-muted-foreground">{user.qualification}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.location}</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {user.experience} yrs</span>
                          <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> ₦{user.hourlyRate?.toLocaleString()}/hr</span>
                        </div>
                        {user.rating && (
                          <div className="flex items-center gap-2 mt-2">
                            <StarRating rating={user.rating} size="sm" />
                            <span className="text-sm text-muted-foreground">({user.reviewCount} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Subjects</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {user.subjects.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Teaching Levels</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {user.preferredLevels.map(l => <Badge key={l} variant="outline">{l}</Badge>)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={`w-5 h-5 ${user.trcnCertified ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <span className="text-sm">{user.trcnCertified ? 'TRCN Certified' : 'Not TRCN Certified'}</span>
                      </div>
                      {user.classType && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{user.classType === 'hybrid' ? '🔄 Hybrid' : user.classType === 'virtual' ? '💻 Virtual' : '🏫 In-Person'}</Badge>
                        </div>
                      )}
                    </div>

                    {user.briefIntro && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">About</h4>
                        <p className="text-sm text-muted-foreground">{user.briefIntro}</p>
                      </div>
                    )}

                    {user.classDelivery && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Teaching Approach</h4>
                        <p className="text-sm text-muted-foreground">{user.classDelivery}</p>
                      </div>
                    )}

                    {user.availabilitySlots && user.availabilitySlots.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-1.5"><Clock className="w-4 h-4" /> Availability</h4>
                        <div className="space-y-1">
                          {user.availabilitySlots.map((slot, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="font-medium w-24">{slot.day}</span>
                              <span className="text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.reviews && user.reviews.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">Recent Reviews</h4>
                        <div className="space-y-3">
                          {user.reviews.slice(0, 3).map(r => (
                            <div key={r.id} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <StarRating rating={r.rating} size="sm" />
                                <span className="text-sm font-medium">{r.reviewerName}</span>
                                <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{r.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Eye className="w-4 h-4 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold">{user.profileViews || 0}</p>
                        <p className="text-xs text-muted-foreground">Profile Views</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
                        <p className="text-sm font-bold">{user.lastOnline ? new Date(user.lastOnline).toLocaleDateString() : 'Now'}</p>
                        <p className="text-xs text-muted-foreground">Last Online</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Award className="w-4 h-4 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold">{getOnboardingPercent()}%</p>
                        <p className="text-xs text-muted-foreground">Onboarding</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Bookings Tab ── */}
          <TabsContent value="bookings">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calendar className="w-6 h-6" /> Assigned Bookings
                </CardTitle>
                <CardDescription>Requests forwarded to you by the administration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(!user.assignedLeads || user.assignedLeads.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No assigned bookings yet. Make sure your profile is complete!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {user.assignedLeads.map((lead: any) => (
                      <Card key={lead.id} className="border border-primary/10 bg-primary/5">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg">{lead.parentName}</h4>
                                <Badge variant="secondary" className="text-[10px]">{lead.date}</Badge>
                              </div>
                              <p className="text-sm italic text-muted-foreground">"{lead.message}"</p>
                              {lead.offerAmount && (
                                <p className="text-sm font-bold text-primary">Budget: ₦{parseInt(lead.offerAmount).toLocaleString()}/hr</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button 
                                className="bg-green-600 hover:bg-green-700 gap-2"
                                onClick={() => window.open(`https://wa.me/${lead.parentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${lead.parentName}, I'm ${user.firstName} from Zane Tutors. I received your booking request for ${user.subjects[0]}...`)}`, '_blank')}
                              >
                                <Phone className="w-4 h-4" /> Chat on WhatsApp
                              </Button>
                              <p className="text-xs text-center text-muted-foreground">{lead.parentPhone}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Documents Tab ── */}
          <TabsContent value="documents">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Verification Documents</CardTitle>
                <CardDescription>Upload or update your documents for verification. You can re-upload anytime.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'id', label: 'Government-issued ID', desc: "NIN slip, International Passport, or Voter's Card", hasExpiry: true },
                  { key: 'cert', label: 'Highest Certificate', desc: 'Degree certificate or transcript', hasExpiry: false },
                ].map(doc => {
                  const detailed = user.uploadedDocsDetailed?.[doc.key];
                  const expiryStatus = detailed ? getDocExpiryStatus(detailed.expiryDate) : null;

                  return (
                    <div key={doc.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">{doc.label}</Label>
                        {expiryStatus && (
                          <Badge className={expiryStatus.color}>{expiryStatus.label}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.desc}</p>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                          {user.uploadedDocs?.[doc.key] ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm truncate block">{user.uploadedDocs[doc.key].split('/').pop()}</span>
                                {detailed?.uploadedAt && (
                                  <span className="text-[10px] text-muted-foreground">Uploaded {new Date(detailed.uploadedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                              <span className="text-xs text-primary ml-auto shrink-0">Re-upload</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                              <span className="text-sm text-muted-foreground">Click to upload</span>
                            </>
                          )}
                          <Input type="file" className="hidden" accept="image/*,.pdf" onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            toast.loading(`Uploading ${doc.label}...`, { id: `upload-${doc.key}` });

                            try {
                              const uploadResult = await tutorApi.uploadDocument(file);
                              const url = uploadResult.url;

                              const newDocs = { ...(user.uploadedDocs || {}), [doc.key]: url };
                              const newDocsDetailed = {
                                ...(user.uploadedDocsDetailed || {}),
                                [doc.key]: {
                                  fileName: file.name,
                                  uploadedAt: new Date().toISOString(),
                                  expiryDate: detailed?.expiryDate,
                                  url: url,
                                },
                              };

                              const updates: Record<string, unknown> = {
                                uploadedDocs: newDocs,
                                uploadedDocsDetailed: newDocsDetailed,
                              };

                              await updateProfile(updates as any);
                              toast.success(`${doc.label} uploaded successfully`, { id: `upload-${doc.key}` });
                            } catch (err) {
                              toast.error(`Failed to upload ${doc.label}`, { id: `upload-${doc.key}` });
                            }
                          }} />
                        </label>
                      </div>
                      {doc.hasExpiry && (
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <Label className="text-xs text-muted-foreground">ID Expiry Date:</Label>
                          <Input
                            type="date"
                            className="h-8 w-auto text-xs"
                            value={detailed?.expiryDate?.split('T')[0] || ''}
                            onChange={e => {
                              const newDocsDetailed = {
                                ...(user.uploadedDocsDetailed || {}),
                                [doc.key]: {
                                  ...(detailed || { fileName: user.uploadedDocs?.[doc.key] || '', uploadedAt: new Date().toISOString() }),
                                  expiryDate: e.target.value,
                                },
                              };
                              updateProfile({ uploadedDocsDetailed: newDocsDetailed });
                              toast.success('Expiry date updated');
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {user.verificationStatus === 'rejected' && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm font-semibold text-destructive">Documents need revision</p>
                    <p className="text-xs text-muted-foreground mt-1">{user.adminNotes || 'Please re-upload your documents and resubmit.'}</p>
                    <Button className="mt-3" size="sm" onClick={() => {
                      updateProfile({ verificationStatus: 'pending' });
                      toast.success('Resubmitted for verification!');
                    }}>Resubmit for Review</Button>
                  </div>
                )}

                {user.verificationStatus === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                    <p className="text-sm text-yellow-800">Your documents are currently under review (typically 24-48 hours).</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Assessment Tab ── */}
          <TabsContent value="assessment">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="w-6 h-6" /> Proficiency Insight
                </CardTitle>
                <CardDescription>Optional teaching insight for your profile and teaching growth — not required to continue tutoring.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="text-lg font-bold mb-2 text-primary">Why take the assessment?</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">✅ Appear higher in the tutor catalogue</li>
                    <li className="flex items-center gap-2">✅ Qualify for premium teaching rates</li>
                    <li className="flex items-center gap-2">✅ Earn badges for your profile</li>
                    <li className="flex items-center gap-2">✅ Gain priority for student bookings</li>
                  </ul>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link to="/assessment" className="flex-1">
                      <Button className="w-full gap-2 gradient-primary text-primary-foreground">
                        Start New Assessment <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/assessment/dashboard" className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        View History <Clock className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">Assessment Categories</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-muted/30">
                      <BookOpen className="w-8 h-8 text-primary mb-2" />
                      <p className="font-bold text-sm">Subject Mastery</p>
                      <p className="text-xs text-muted-foreground">Detailed questions on your chosen subjects.</p>
                    </Card>
                    <Card className="p-4 bg-muted/30">
                      <Laptop className="w-8 h-8 text-accent mb-2" />
                      <p className="font-bold text-sm">Digital Tools</p>
                      <p className="text-xs text-muted-foreground">Knowledge of virtual teaching platforms.</p>
                    </Card>
                    <Card className="p-4 bg-muted/30">
                      <Brain className="w-8 h-8 text-secondary mb-2" />
                      <p className="font-bold text-sm">Psychology</p>
                      <p className="text-xs text-muted-foreground">Teaching approach and cognitive assessment.</p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Achievements / Gamification Tab ── */}
          <TabsContent value="achievements">
            <GamificationPanel />
          </TabsContent>

          {/* ── Settings Tab ── */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm font-medium">{user.phone || '—'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Member Since</Label>
                      <p className="text-sm font-medium">{user.createdAt || '—'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge className={statusColor}>{statusText}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                      </div>
                    </div>
                    <Button type="submit">Update Password</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Notifications Tab ── */}
          <TabsContent value="notifications">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5" /> Notification Preferences</CardTitle>
                <CardDescription>Choose what updates you'd like to receive from Zane Tutors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'registration', label: 'Registration Updates', desc: 'Status changes on your onboarding and verification' },
                  { key: 'programs', label: 'Special Programs', desc: 'Get notified about new training programs, workshops, and certifications' },
                  { key: 'updates', label: 'Platform Updates', desc: 'News about new features and platform improvements' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications(p => ({ ...p, [item.key]: checked }))}
                    />
                  </div>
                ))}

                <Separator />

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Recent Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">Documents received — under review</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Bell className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm">Welcome to Zane Tutors! Complete your onboarding to get listed.</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
