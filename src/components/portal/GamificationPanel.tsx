import { useAuth } from '@/contexts/AuthContext';
import { GAMIFICATION_BADGES } from '@/types/tutor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trophy, Star, Flame, Medal, Crown, Award, CheckCircle2 } from 'lucide-react';

const badgeIcons: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="w-5 h-5 text-primary" />,
  BookOpen: <Star className="w-5 h-5 text-accent" />,
  GraduationCap: <Award className="w-5 h-5 text-amber-500" />,
  BadgeCheck: <CheckCircle2 className="w-5 h-5 text-success" />,
  Star: <Star className="w-5 h-5 text-yellow-500" />,
  Crown: <Crown className="w-5 h-5 text-amber-500" />,
};

export default function GamificationPanel() {
  const { user, allTutors } = useAuth();
  if (!user) return null;

  const gam = user.gamification || { points: 0, badges: [], completedModules: [] };

  // Compute leaderboard from all verified tutors
  const leaderboard = allTutors
    .filter(t => t.isVerified)
    .map(t => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      points: t.gamification?.points || 0,
      badges: t.gamification?.badges?.length || 0,
      isTotm: t.gamification?.tutorOfTheMonth || false,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const userRank = leaderboard.findIndex(l => l.id === user.id) + 1;

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{gam.points}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <Medal className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{gam.badges.length}</p>
            <p className="text-xs text-muted-foreground">Badges Earned</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4 text-center">
            <Trophy className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{userRank > 0 ? `#${userRank}` : '—'}</p>
            <p className="text-xs text-muted-foreground">Your Rank</p>
          </CardContent>
        </Card>
      </div>

      {/* Tutor of the Month */}
      {gam.tutorOfTheMonth && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="py-4 flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-500" />
            <div>
              <p className="font-bold text-yellow-800">Tutor of the Month!</p>
              <p className="text-sm text-yellow-700">You've been selected as this month's top tutor. Congratulations!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Star className="w-5 h-5" /> Digital Badges</CardTitle>
          <CardDescription>Earn badges by completing milestones and training</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GAMIFICATION_BADGES.map(badge => {
              const earned = gam.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-xl p-3 text-center border-2 transition-all ${
                    earned
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-dashed border-muted-foreground/30 opacity-50'
                  }`}
                >
                  <span className="block mb-1 flex justify-center">{badgeIcons[badge.icon] || <Trophy className="w-5 h-5 text-muted-foreground" />}</span>
                  <p className="text-xs font-semibold">{badge.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                  {earned ? (
                    <Badge className="mt-2 text-[10px]">Earned</Badge>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-2">{badge.pointsRequired} pts needed</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5" /> Leaderboard</CardTitle>
          <CardDescription>Top tutors by points and training completion</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tutors on the leaderboard yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    entry.id === user.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <span className={`text-lg font-bold w-8 text-center ${idx < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {idx === 0 ? <Trophy className="w-5 h-5 inline text-yellow-500" /> : idx === 1 ? <Medal className="w-5 h-5 inline text-slate-400" /> : idx === 2 ? <Medal className="w-5 h-5 inline text-amber-700" /> : `${idx + 1}`}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {entry.name}
                      {entry.isTotm && <Crown className="w-3.5 h-3.5 inline ml-1 text-amber-500" />}
                      {entry.id === user.id && <span className="text-xs text-primary ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.badges} badges</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{entry.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}