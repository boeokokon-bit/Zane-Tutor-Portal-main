import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import AssessmentHistoryCard from '@/components/assessment/dashboard/AssessmentHistoryCard';
import AssessmentDetailDialog from '@/components/assessment/dashboard/AssessmentDetailDialog';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentApi as wpApi, AssessmentSummary } from '@/lib/api';

const AssessmentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="mb-8 text-left">
          <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
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

export default AssessmentDashboard;
