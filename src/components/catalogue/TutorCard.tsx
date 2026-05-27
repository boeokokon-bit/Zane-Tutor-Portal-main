import { TutorProfile } from '@/types/tutor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, BookOpen, CheckCircle, ShieldCheck, Monitor, Users, Repeat, Crown } from 'lucide-react';
import StarRating from './StarRating';
import { useAuth } from '@/contexts/AuthContext';

interface TutorCardProps {
  tutor: TutorProfile;
  onClick: (tutor: TutorProfile) => void;
}

const classTypeIcon = { offline: Users, virtual: Monitor, hybrid: Repeat } as const;
const classTypeLabel = { offline: 'In-Person', virtual: 'Virtual', hybrid: 'Hybrid' } as const;

export default function TutorCard({ tutor, onClick }: TutorCardProps) {
  const { settings } = useAuth();
  const t = tutor;
  const firstName = t.firstName || '';
  const lastName = t.lastName || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || '?';
  const ClassIcon = t.classType ? classTypeIcon[t.classType] : null;
  const isTOTM = t.gamification?.tutorOfTheMonth;
  const subjects = t.subjects || [];
  const preferredLevels = t.preferredLevels || [];

  // Calculate display rate based on commission settings
  const commissionMultiplier = 1 + ((settings?.commissionRate || 30) / 100);
  const displayRate = Math.round((t.hourlyRate || 0) * commissionMultiplier);

  return (
    <Card
      className={`border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group overflow-hidden ${isTOTM ? 'ring-2 ring-amber-400' : ''}`}
      onClick={() => onClick(t)}
    >
      <CardContent className="p-0">
        {/* Profile Photo - Top */}
        <div className="relative bg-primary/5 flex items-center justify-center pt-8 pb-6">
          <Avatar className="w-24 h-24 ring-4 ring-background shadow-lg">
            {t.profilePhoto ? (
              <AvatarImage src={t.profilePhoto} alt={`${t.firstName} ${t.lastName}`} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Left Badge: TOTM */}
          {isTOTM && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-amber-400 text-amber-900 border-amber-500 gap-1 animate-pulse shadow-sm">
                <Crown className="w-3 h-3 fill-amber-900" /> TOP TUTOR
              </Badge>
            </div>
          )}

          {/* Right badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            {t.isVerified && (
              <Badge className="bg-emerald-500 text-white text-xs gap-1">
                <CheckCircle className="w-3 h-3" /> Verified
              </Badge>
            )}
            {t.trcnCertified && (
              <Badge className="bg-blue-600 text-white text-xs gap-1">
                <ShieldCheck className="w-3 h-3" /> TRCN
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-5 text-center">
          <h3 className="font-bold text-lg">{t.firstName} {t.lastName}</h3>
          {t.qualification && (
            <p className="text-sm text-muted-foreground mt-0.5">{t.qualification}</p>
          )}

          {/* Star Rating */}
          {t.rating !== undefined && t.rating > 0 && (
            <div className="flex justify-center mt-2">
              <StarRating rating={t.rating} reviewCount={t.reviewCount} showValue />
            </div>
          )}

          {subjects.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {subjects.slice(0, 3).map(s => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
              {subjects.length > 3 && (
                <Badge variant="outline" className="text-xs">+{subjects.length - 3}</Badge>
              )}
            </div>
          )}

          {t.briefIntro && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{t.briefIntro}</p>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {t.location}</span>
            {t.experience > 0 && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.experience} yrs</span>
            )}
            {t.hourlyRate > 0 && (
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> ₦{displayRate.toLocaleString()}/hr</span>
            )}
          </div>

          {/* Class Type */}
          {t.classType && ClassIcon && (
            <div className="flex justify-center mt-2">
              <Badge variant="outline" className="text-xs gap-1">
                <ClassIcon className="w-3 h-3" /> {classTypeLabel[t.classType]}
              </Badge>
            </div>
          )}

          {preferredLevels.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {preferredLevels.join(' · ')}
            </p>
          )}

          <Button size="sm" className="mt-4 w-full group-hover:bg-primary/90">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
