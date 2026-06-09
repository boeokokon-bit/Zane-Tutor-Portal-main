import { useEffect, useMemo, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  BookOpen,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  Monitor,
  Users,
  Repeat,
  GraduationCap,
  Calendar,
  Folder,
  Briefcase,
  User,
  MessageSquare,
  Share2,
} from 'lucide-react';
import StarRating from '@/components/catalogue/StarRating';
import Footer from '@/components/layout/Footer';
import { TutorProfile as TutorProfileType } from '@/types/tutor';

interface SectionProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function TutorProfile() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const { allTutors, refreshTutors, settings } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (allTutors.length === 0) {
        await refreshTutors();
      }
      setLoading(false);
    };
    load();
  }, [allTutors.length, refreshTutors]);

  const tutor = useMemo<TutorProfileType | null>(() => {
    if (!tutorId) return null;
    return allTutors.find(t => t.id === tutorId) || null;
  }, [allTutors, tutorId]);

  const handleCopyLink = async () => {
    if (!navigator.clipboard) {
      toast.error('Clipboard is not available in this browser.');
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard');
  };

  const handleWhatsApp = () => {
    if (!settings?.whatsappNumber) return;
    const message = `Hello, I found your profile on Zane Tutors and would like to learn more about your tutoring services.`;
    const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg font-medium">Loading tutor profile…</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 text-center">
        <div className="max-w-xl rounded-3xl border border-border bg-background p-10 shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">We could not locate that tutor page. It may no longer be available or the link is incorrect.</p>
          <Link to="/catalogue">
            <Button>Browse tutors</Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstName = tutor.firstName || '';
  const lastName = tutor.lastName || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || '?';
  const classTypeIcon = { offline: Users, virtual: Monitor, hybrid: Repeat } as const;
  const classTypeLabel = { offline: 'In-Person', virtual: 'Virtual / Online', hybrid: 'Hybrid (In-Person + Virtual)' } as const;
  const ClassIcon = tutor.classType ? classTypeIcon[tutor.classType] : null;
  const subjects = tutor.subjects || [];
  const preferredLevels = tutor.preferredLevels || [];
  const pastProjects = tutor.pastProjects || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-primary/80">Tutor profile</p>
            <h1 className="mt-3 text-4xl font-bold">{tutor.firstName} {tutor.lastName}</h1>
            {tutor.qualification && <p className="mt-2 text-muted-foreground text-lg">{tutor.qualification}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleCopyLink} className="gap-2">
              <Share2 className="w-4 h-4" /> Copy profile link
            </Button>
            <Button onClick={handleWhatsApp} className="gap-2">
              <MessageSquare className="w-4 h-4" /> Contact via WhatsApp
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-background p-8 text-center shadow-sm">
              <Avatar className="w-32 h-32 mx-auto ring-4 ring-background shadow-lg">
                {tutor.profilePhoto ? (
                  <AvatarImage src={tutor.profilePhoto} alt={`${tutor.firstName} ${tutor.lastName}`} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-5 space-y-3">
                <div>
                  {tutor.rating !== undefined && tutor.rating > 0 ? (
                    <StarRating rating={tutor.rating} size="md" reviewCount={tutor.reviewCount} showValue />
                  ) : (
                    <Badge variant="outline">No reviews yet</Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-muted/70 p-3">
                    <p className="font-semibold">{tutor.experience}</p>
                    <p className="text-muted-foreground">Years Exp.</p>
                  </div>
                  <div className="rounded-2xl bg-muted/70 p-3">
                    <p className="font-semibold">{subjects.length}</p>
                    <p className="text-muted-foreground">Subjects</p>
                  </div>
                  <div className="rounded-2xl bg-muted/70 p-3">
                    <p className="font-semibold">{preferredLevels.length}</p>
                    <p className="text-muted-foreground">Levels</p>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{tutor.location}</span>
                  </div>
                  {tutor.isVerified && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Verified tutor</span>
                    </div>
                  )}
                  {tutor.trcnCertified && (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>TRCN certified</span>
                    </div>
                  )}
                  {tutor.classType && ClassIcon && (
                    <div className="flex items-center gap-2">
                      <ClassIcon className="w-4 h-4 text-primary" />
                      <span>{classTypeLabel[tutor.classType]}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="w-4 h-4" /> Qualification
                  </div>
                  <p>{tutor.qualification || 'Not provided'}</p>
                  {tutor.currentWork && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="w-4 h-4" /> Current work
                    </div>
                  )}
                  {tutor.currentWork && <p>{tutor.currentWork}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {tutor.briefIntro && (
              <Section icon={User} title="About">
                <p className="text-sm text-muted-foreground leading-relaxed">{tutor.briefIntro}</p>
              </Section>
            )}

            {tutor.classDelivery && (
              <Section icon={Monitor} title="Class Delivery">
                <p className="text-sm text-muted-foreground leading-relaxed">{tutor.classDelivery}</p>
              </Section>
            )}

            {subjects.length > 0 && (
              <Section icon={BookOpen} title="Subjects">
                <div className="flex flex-wrap gap-2">
                  {subjects.map(subject => (
                    <Badge key={subject} variant="secondary">{subject}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {preferredLevels.length > 0 && (
              <Section icon={GraduationCap} title="Preferred Levels">
                <div className="flex flex-wrap gap-2">
                  {preferredLevels.map(level => (
                    <Badge key={level} variant="outline">{level}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {tutor.teachingHistory && (
              <Section icon={Briefcase} title="Teaching History">
                <p className="text-sm text-muted-foreground leading-relaxed">{tutor.teachingHistory}</p>
              </Section>
            )}

            {(tutor.availabilitySlots?.length || tutor.availability) && (
              <Section icon={Calendar} title="Availability">
                {tutor.availabilitySlots && tutor.availabilitySlots.length > 0 ? (
                  <div className="space-y-2">
                    {tutor.availabilitySlots.map((slot, index) => (
                      <div key={index} className="rounded-2xl bg-muted/60 px-4 py-3 text-sm">
                        <div className="flex justify-between font-medium">{slot.day}</div>
                        <div className="text-muted-foreground">{slot.startTime} — {slot.endTime}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{tutor.availability}</p>
                )}
              </Section>
            )}

            {tutor.hourlyRate > 0 && (
              <Section icon={BookOpen} title="Pricing">
                <div className="rounded-3xl bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Hourly rate</p>
                  <p className="mt-2 text-3xl font-bold text-primary">₦{Math.round(tutor.hourlyRate * (1 + ((settings?.commissionRate ?? 30) / 100))).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </div>
              </Section>
            )}

            {pastProjects.length > 0 && (
              <Section icon={Folder} title="Past Projects">
                <div className="space-y-4">
                  {pastProjects.map((project, index) => (
                    <div key={index} className="rounded-3xl bg-muted/30 p-4">
                      <p className="font-semibold">{project.title}</p>
                      {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
