import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ClipboardList, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import AssessmentHistoryCard from '@/components/dashboard/AssessmentHistoryCard';
import AssessmentDetailDialog from '@/components/dashboard/AssessmentDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { wpApi, AssessmentSummary } from '@/lib/wordpressApi';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    wpApi.getAssessments()
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {user?.first_name}!</h1>
          <p className="text-muted-foreground">Your assessment history</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No assessments yet</h2>
            <p className="text-muted-foreground mb-6">Take your first proficiency assessment to see results here.</p>
            <Link to="/assessment">
              <Button className="gradient-primary text-primary-foreground gap-2">
                Start Assessment <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map(a => (
              <AssessmentHistoryCard key={a.id} assessment={a} onView={setSelectedId} />
            ))}
          </div>
        )}

        <AssessmentDetailDialog
          assessmentId={selectedId}
          open={selectedId !== null}
          onOpenChange={open => { if (!open) setSelectedId(null); }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
