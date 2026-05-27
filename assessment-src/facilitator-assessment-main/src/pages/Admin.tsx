import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Users,
  ClipboardList,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
  Search,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { wpApi, AssessmentSummary } from '@/lib/wordpressApi';
import { SUBJECT_LABELS } from '@/types/assessment';
import { toast } from 'sonner';

const Admin = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const isAdmin = user?.roles?.some(r => 
    ['administrator', 'editor', 'admin'].includes(r)
  );

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    wpApi.getAssessments()
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, isAdmin]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8">
            <ShieldX className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You don't have admin privileges.</p>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assessmentLink = `${window.location.origin}${window.location.pathname}#/assessment`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(assessmentLink);
    setCopiedLink(true);
    toast.success('Assessment link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filtered = assessments.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.subjects?.some(s => s.toLowerCase().includes(q)) ||
      a.readiness_level?.toLowerCase().includes(q) ||
      String(a.overall_score).includes(q)
    );
  });

  const totalAssessments = assessments.length;
  const passedCount = assessments.filter(a => a.overall_score >= 70).length;
  const avgScore = totalAssessments > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.overall_score, 0) / totalAssessments)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage assessments and view results</p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> My Dashboard
            </Button>
          </Link>
        </div>

        {/* Share Test Link */}
        <Card className="p-6 mb-8 border-primary/20 bg-primary/[0.02]">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Share Assessment Link
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share this link with tutors so they can take the proficiency assessment.
          </p>
          <div className="flex gap-2">
            <Input
              value={assessmentLink}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button onClick={handleCopyLink} className="gap-2 gradient-primary text-primary-foreground shrink-0">
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{totalAssessments}</div>
            <p className="text-sm text-muted-foreground">Total Assessments</p>
          </Card>
          <Card className="p-5 text-center">
            <ShieldCheck className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="text-3xl font-bold text-success">{passedCount}</div>
            <p className="text-sm text-muted-foreground">Passed (≥70%)</p>
          </Card>
          <Card className="p-5 text-center">
            <ClipboardList className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-3xl font-bold">{avgScore}%</div>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, score, or level..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching results' : 'No assessments yet'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term.' : 'Share the assessment link with tutors to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <Card key={a.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{a.date}</span>
                      <Badge variant={a.overall_score >= 70 ? 'default' : 'destructive'} className="text-xs">
                        {a.overall_score >= 70 ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {a.subjects?.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-muted rounded text-xs font-medium">
                          {SUBJECT_LABELS[s as keyof typeof SUBJECT_LABELS] || s}
                        </span>
                      ))}
                    </div>
                    {a.subject_scores && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {a.subject_scores.map(ss => (
                          <span key={ss.subject} className={`${ss.percentage >= 70 ? 'text-success' : 'text-destructive'}`}>
                            {SUBJECT_LABELS[ss.subject as keyof typeof SUBJECT_LABELS] || ss.subject}: {ss.percentage}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-bold ${a.overall_score >= 70 ? 'text-success' : 'text-destructive'}`}>
                      {a.overall_score}%
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{a.readiness_level?.replace('_', ' ')}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
