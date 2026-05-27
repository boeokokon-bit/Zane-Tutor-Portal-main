import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Eye, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SUBJECT_LABELS, Subject } from '@/types/assessment';
import { getReadinessEmoji, getReadinessLabel, getStatusColor } from '@/lib/assessmentUtils';
import type { AssessmentSummary } from '@/lib/wordpressApi';

interface Props {
  assessment: AssessmentSummary;
  onView: (id: number) => void;
}

const readinessColor: Record<string, string> = {
  exam_ready: 'bg-success/10 text-success border-success/20',
  moderate_prep: 'bg-accent/10 text-accent border-accent/20',
  significant_prep: 'bg-warning/10 text-warning border-warning/20',
  urgent_intervention: 'bg-destructive/10 text-destructive border-destructive/20',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'excellent' || status === 'good') return <CheckCircle className="w-3.5 h-3.5 text-success" />;
  if (status === 'needs_work') return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
};

const AssessmentHistoryCard = ({ assessment, onView }: Props) => {
  const level = assessment.readiness_level as any;
  const date = new Date(assessment.date).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">{date}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl font-bold">{assessment.overall_score}<span className="text-lg text-muted-foreground">/100</span></span>
            <Badge variant="outline" className={readinessColor[level] || ''}>
              {getReadinessEmoji(level)} {getReadinessLabel(level)}
            </Badge>
          </div>

          {/* Subject scores breakdown */}
          {assessment.subject_scores && assessment.subject_scores.length > 0 ? (
            <div className="space-y-2 mb-3">
              {assessment.subject_scores.map(ss => (
                <div key={ss.subject} className="flex items-center gap-2">
                  <StatusIcon status={ss.status} />
                  <span className="text-xs font-medium w-28 truncate">{SUBJECT_LABELS[ss.subject as Subject] || ss.subject}</span>
                  <Progress value={ss.percentage} className="h-1.5 flex-1" />
                  <span className={`text-xs font-semibold w-8 text-right ${getStatusColor(ss.status as any)}`}>{ss.percentage}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {assessment.subjects.map(s => (
                <span key={s} className="px-2 py-0.5 text-xs bg-muted rounded-full">
                  {SUBJECT_LABELS[s as Subject] || s}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => onView(assessment.id)}>
          <Eye className="w-4 h-4" /> View
        </Button>
      </div>
    </Card>
  );
};

export default AssessmentHistoryCard;
