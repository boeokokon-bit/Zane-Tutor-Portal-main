import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { assessmentApi as wpApi } from '@/lib/api';
import { SUBJECT_LABELS, AssessmentResult, SubjectResult } from '@/types/assessment';
import { getReadinessEmoji, getReadinessLabel, getStatusColor } from '@/lib/assessmentUtils';

interface Props {
  assessmentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'excellent' || status === 'good') return <CheckCircle className="w-4 h-4 text-success" />;
  if (status === 'needs_work') return <AlertTriangle className="w-4 h-4 text-warning" />;
  return <XCircle className="w-4 h-4 text-destructive" />;
};

const AssessmentDetailDialog = ({ assessmentId, open, onOpenChange }: Props) => {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!assessmentId || !open) return;
    setIsLoading(true);
    wpApi.getAssessment(assessmentId)
      .then(data => setResult(data.result_data as unknown as AssessmentResult))
      .catch(() => setResult(null))
      .finally(() => setIsLoading(false));
  }, [assessmentId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assessment Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        )}

        {!isLoading && result && (
          <div className="space-y-6">
            {/* Score summary */}
            <div className="text-center py-4">
              <div className="text-5xl font-bold mb-1">{result.finalReadinessScore}<span className="text-xl text-muted-foreground">/100</span></div>
              <p className="text-lg">{getReadinessEmoji(result.readinessLevel)} {getReadinessLabel(result.readinessLevel)}</p>
            </div>

            {/* Subject breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Subject Scores</h3>
              {result.subjectResults.map((sr: SubjectResult) => (
                <Card key={sr.subject} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={sr.status} />
                      <span className="font-medium">{SUBJECT_LABELS[sr.subject]}</span>
                    </div>
                    <span className={`font-bold ${getStatusColor(sr.status)}`}>{sr.percentage}%</span>
                  </div>
                  <Progress value={sr.percentage} className="h-2" />
                  {sr.weakTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sr.weakTopics.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-muted rounded-full border border-border">{t}</span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !result && (
          <p className="text-center text-muted-foreground py-8">Could not load assessment details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentDetailDialog;
