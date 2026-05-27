import { useState } from 'react';
import { TutorProfile } from '@/types/tutor';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, Clock, BookOpen, CheckCircle, Mail, ShieldCheck,
  Briefcase, GraduationCap, Calendar, User, Monitor, Users, Repeat, MessageSquare, Phone,
  Crown, Folder
} from 'lucide-react';
import StarRating from './StarRating';
import LeadFormDialog from './LeadFormDialog';

interface TutorProfileDialogProps {
  tutor: TutorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const classTypeIcon = { offline: Users, virtual: Monitor, hybrid: Repeat } as const;
const classTypeLabel = { offline: 'In-Person', virtual: 'Virtual / Online', hybrid: 'Hybrid (In-Person + Virtual)' } as const;

export default function TutorProfileDialog({ tutor, open, onOpenChange }: TutorProfileDialogProps) {
  const { settings } = useAuth();
  const [leadForm, setLeadForm] = useState<{ open: boolean; type: 'contact' | 'offer' }>({ open: false, type: 'contact' });

  if (!tutor) return null;
  const t = tutor;
  const firstName = t.firstName || '';
  const lastName = t.lastName || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || '?';
  const ClassIcon = t.classType ? classTypeIcon[t.classType] : null;
  const subjects = t.subjects || [];
  const preferredLevels = t.preferredLevels || [];
  const pastProjects = t.pastProjects || [];

  const handleWhatsApp = () => {
    const message = `Hello, I saw your profile on Zane Tutors and I'm interested in booking sessions for ${subjects.slice(0, 2).join(', ') || 'your services'}.`;
    const url = `https://wa.me/${settings?.whatsappNumber || ''}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Hero header */}
          <div className="bg-primary/5 px-6 pt-8 pb-6 text-center">
            <Avatar className="w-28 h-28 mx-auto ring-4 ring-background shadow-lg">
              {t.profilePhoto ? (
                <AvatarImage src={t.profilePhoto} alt={`${t.firstName} ${t.lastName}`} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <DialogHeader className="mt-4">
              <DialogTitle className="text-2xl font-bold text-center">
                {t.firstName} {t.lastName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed profile and booking options for {t.firstName} {t.lastName}
              </DialogDescription>
            </DialogHeader>

            {t.qualification && (
              <p className="text-muted-foreground mt-1">{t.qualification}</p>
            )}

            {/* Star Rating */}
            {t.rating !== undefined && t.rating > 0 && (
              <div className="flex justify-center mt-2">
                <StarRating rating={t.rating} size="md" reviewCount={t.reviewCount} showValue />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {t.isVerified && (
                <Badge className="bg-emerald-500 text-white gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified Tutor
                </Badge>
              )}
              {t.trcnCertified && (
                <Badge className="bg-blue-600 text-white gap-1">
                  <ShieldCheck className="w-3 h-3" /> TRCN Certified
                </Badge>
              )}
              <Badge variant="outline">
                <MapPin className="w-3 h-3 mr-1" /> {t.location}
              </Badge>
              {t.classType && ClassIcon && (
                <Badge variant="outline" className="gap-1">
                  <ClassIcon className="w-3 h-3" /> {classTypeLabel[t.classType]}
                </Badge>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{t.experience}</p>
                <p className="text-xs text-muted-foreground">Years Exp.</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <BookOpen className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{subjects.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <GraduationCap className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold">{preferredLevels.length}</p>
                <p className="text-xs text-muted-foreground">Levels</p>
              </div>
            </div>

            {/* TRCN Status */}
            <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
              <ShieldCheck className={`w-5 h-5 ${t.trcnCertified ? 'text-blue-600' : 'text-muted-foreground/40'}`} />
              <div>
                <p className="text-sm font-medium">TRCN Certification</p>
                <p className="text-xs text-muted-foreground">
                  {t.trcnCertified ? 'This tutor holds a valid TRCN certification' : 'Not TRCN certified'}
                </p>
              </div>
              <div className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${t.trcnCertified ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
                {t.trcnCertified ? 'Yes' : 'No'}
              </div>
            </div>

            {/* About */}
            {t.briefIntro && (
              <Section icon={User} title="About">
                <p className="text-sm text-muted-foreground leading-relaxed">{t.briefIntro}</p>
              </Section>
            )}

            {/* Class Delivery */}
            {t.classDelivery && (
              <Section icon={Monitor} title="Class Delivery">
                <p className="text-sm text-muted-foreground leading-relaxed">{t.classDelivery}</p>
              </Section>
            )}

            {/* Subjects */}
            {subjects.length > 0 && (
              <Section icon={BookOpen} title="Subjects">
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {/* Levels */}
            {preferredLevels.length > 0 && (
              <Section icon={GraduationCap} title="Preferred Levels">
                <div className="flex flex-wrap gap-2">
                  {preferredLevels.map(l => (
                    <Badge key={l} variant="outline">{l}</Badge>
                  ))}
                </div>
              </Section>
            )}

            {/* Teaching History */}
            {t.teachingHistory && (
              <Section icon={Briefcase} title="Teaching History">
                <p className="text-sm text-muted-foreground leading-relaxed">{t.teachingHistory}</p>
              </Section>
            )}

            {/* Current Work */}
            {t.currentWork && (
              <Section icon={Briefcase} title="Current Work">
                <p className="text-sm text-muted-foreground">{t.currentWork}</p>
              </Section>
            )}

            {/* Availability */}
            <Section icon={Calendar} title="Availability">
              {t.availabilitySlots && t.availabilitySlots.length > 0 ? (
                <div className="space-y-1.5">
                  {t.availabilitySlots.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2 text-sm">
                      <span className="font-medium">{slot.day}</span>
                      <span className="text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              ) : t.availability ? (
                <p className="text-sm text-muted-foreground">{t.availability}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No availability set</p>
              )}
            </Section>

            {/* Pricing */}
            {t.hourlyRate > 0 && (
              <Section icon={BookOpen} title="Pricing">
                <div className="bg-primary/5 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="text-2xl font-bold text-primary">₦{Math.round(t.hourlyRate * (1 + ((settings?.commissionRate ?? 30) / 100))).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </div>
              </Section>
            )}

            {/* Past Projects (Skill Experts) — public sees title + description only, no links */}
            {pastProjects.length > 0 && (
              <Section icon={Folder} title="Past Projects">
                <div className="space-y-2">
                  {pastProjects.map((p, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm font-semibold">{p.title}</p>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Portfolio & Impact */}
            {(t.successStories || t.academicAchievements) && (
              <Section icon={Crown} title="Portfolio & Impact">
                <div className="space-y-4">
                  {t.successStories && (
                    <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Success Stories</p>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "{t.successStories}"
                      </p>
                    </div>
                  )}
                  {t.academicAchievements && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Academic Achievements</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t.academicAchievements}
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            <Separator />

            {/* Reviews */}
            <Section icon={MessageSquare} title={`Reviews${t.reviewCount ? ` (${t.reviewCount})` : ''}`}>
              {t.reviews && t.reviews.length > 0 ? (
                <div className="space-y-4">
                  {t.reviews.map(review => (
                    <div key={review.id} className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{review.reviewerName}</span>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No reviews yet</p>
              )}
            </Section>

            <Separator />

            {/* Contact / Book */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                size="lg"
                onClick={() => setLeadForm({ open: true, type: 'offer' })}
              >
                💼 Make an Offer
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1 gap-2"
                onClick={() => setLeadForm({ open: true, type: 'contact' })}
              >
                <Calendar className="w-4 h-4" /> Book Session
              </Button>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
                onClick={handleWhatsApp}
              >
                <Phone className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LeadFormDialog 
        tutor={tutor} 
        open={leadForm.open} 
        onOpenChange={(open) => setLeadForm({ ...leadForm, open })}
        type={leadForm.type}
      />
    </>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}
